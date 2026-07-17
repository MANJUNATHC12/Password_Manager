import os
from typing import Optional
from datetime import datetime, date
from uuid import UUID
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query,
    UploadFile,
    File,
    Form,
)
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from pydantic import BaseModel
from urllib.parse import quote

from app.database import get_db_dependency
from app.auth.dependencies import get_current_user
from app.models import Document

router = APIRouter(prefix="/documents", tags=["Documents"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class DocumentResponse(BaseModel):
    id: UUID
    doc_type: str
    doc_number: Optional[str] = None
    holder_name: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    notes: Optional[str] = None
    has_file: bool = False
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    entries: list[DocumentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ExpiringDocument(BaseModel):
    id: UUID
    doc_type: str
    doc_number: Optional[str] = None
    holder_name: Optional[str] = None
    expiry_date: str
    days_until_expiry: int
    expired: bool


class ExpiringResponse(BaseModel):
    entries: list[ExpiringDocument]
    total: int
    days: int


def serialize_document(doc: Document) -> dict:
    return {
        "id": doc.id,
        "doc_type": doc.doc_type,
        "doc_number": doc.doc_number,
        "holder_name": doc.holder_name,
        "issue_date": doc.issue_date,
        "expiry_date": doc.expiry_date,
        "notes": doc.notes,
        "has_file": doc.file_data is not None,
        "file_name": doc.file_name,
        "file_type": doc.file_type,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
    }


async def _get_owned(doc_id: str, user, db: AsyncSession) -> Document:
    result = await db.execute(
        select(Document).where(
            Document.id == doc_id,
            Document.user_id == user.id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return doc


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    doc_type: str = Form("Other"),
    doc_number: Optional[str] = Form(None),
    holder_name: Optional[str] = Form(None),
    issue_date: Optional[str] = Form(None),
    expiry_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    file_data = file_name = file_type = None
    if file is not None and file.filename:
        file_data = await file.read()
        if len(file_data) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File too large (max 10 MB)",
            )
        file_name = file.filename
        file_type = file.content_type

    doc = Document(
        user_id=current_user.id,
        doc_type=doc_type or "Other",
        doc_number=doc_number,
        holder_name=holder_name,
        issue_date=issue_date,
        expiry_date=expiry_date,
        notes=notes,
        file_data=file_data,
        file_name=file_name,
        file_type=file_type,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return serialize_document(doc)


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    doc_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    query = select(Document).where(Document.user_id == current_user.id)
    if doc_type:
        query = query.where(Document.doc_type == doc_type)
    if search:
        term = f"%{search}%"
        query = query.where(
            or_(
                Document.doc_type.ilike(term),
                Document.doc_number.ilike(term),
                Document.holder_name.ilike(term),
            )
        )

    total = await db.scalar(select(func.count()).select_from(query.subquery())) or 0
    query = query.order_by(Document.updated_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(query)).scalars().all()
    total_pages = (total + page_size - 1) // page_size

    return DocumentListResponse(
        entries=[serialize_document(d) for d in rows],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/expiring", response_model=ExpiringResponse)
async def expiring_documents(
    days: int = Query(10, ge=0, le=365),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    result = await db.execute(
        select(Document).where(Document.user_id == current_user.id)
    )
    docs = result.scalars().all()
    today = date.today()

    items: list[ExpiringDocument] = []
    for d in docs:
        if not d.expiry_date:
            continue
        try:
            exp = datetime.strptime(d.expiry_date.strip()[:10], "%Y-%m-%d").date()
        except (ValueError, AttributeError):
            continue
        delta = (exp - today).days
        if delta <= days:
            items.append(
                ExpiringDocument(
                    id=d.id,
                    doc_type=d.doc_type,
                    doc_number=d.doc_number,
                    holder_name=d.holder_name,
                    expiry_date=d.expiry_date,
                    days_until_expiry=delta,
                    expired=delta < 0,
                )
            )

    items.sort(key=lambda x: x.days_until_expiry)
    return ExpiringResponse(entries=items, total=len(items), days=days)


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    doc = await _get_owned(doc_id, current_user, db)
    return serialize_document(doc)


@router.get("/{doc_id}/file")
async def download_file(
    doc_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    doc = await _get_owned(doc_id, current_user, db)
    if not doc.file_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No file attached to this document",
        )
    fname = quote(doc.file_name or "document")
    return Response(
        content=doc.file_data,
        media_type=doc.file_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )


@router.patch("/{doc_id}", response_model=DocumentResponse)
async def update_document(
    doc_id: str,
    doc_type: Optional[str] = Form(None),
    doc_number: Optional[str] = Form(None),
    holder_name: Optional[str] = Form(None),
    issue_date: Optional[str] = Form(None),
    expiry_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    doc = await _get_owned(doc_id, current_user, db)

    if doc_type is not None:
        doc.doc_type = doc_type or "Other"
    if doc_number is not None:
        doc.doc_number = doc_number
    if holder_name is not None:
        doc.holder_name = holder_name
    if issue_date is not None:
        doc.issue_date = issue_date
    if expiry_date is not None:
        doc.expiry_date = expiry_date
    if notes is not None:
        doc.notes = notes

    if file is not None and file.filename:
        file_data = await file.read()
        if len(file_data) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File too large (max 10 MB)",
            )
        doc.file_data = file_data
        doc.file_name = file.filename
        doc.file_type = file.content_type

    await db.commit()
    await db.refresh(doc)
    return serialize_document(doc)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    doc = await _get_owned(doc_id, current_user, db)
    await db.delete(doc)
    await db.commit()
