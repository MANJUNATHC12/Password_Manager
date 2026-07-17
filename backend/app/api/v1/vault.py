import os
from typing import Optional
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field, field_validator
from app.database import get_db_dependency
from app.auth.dependencies import get_current_user
from app.models import VaultEntry

router = APIRouter(prefix="/vault", tags=["Vault"])


class VaultEntryCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    username: Optional[str] = Field(None, max_length=200)
    password: Optional[str] = Field(None)
    url: Optional[str] = Field(None, max_length=500)
    totp_secret: Optional[str] = Field(None, max_length=100)
    category: str = Field(default="General", max_length=50)
    notes: Optional[str] = None
    custom_fields: Optional[dict] = None


class VaultEntryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    username: Optional[str] = Field(None, max_length=200)
    password: Optional[str] = Field(None)
    url: Optional[str] = Field(None, max_length=500)
    totp_secret: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None
    custom_fields: Optional[dict] = None


class VaultEntryResponse(BaseModel):
    id: UUID
    title: str
    username: Optional[str] = None
    password: Optional[str] = None
    url: Optional[str] = None
    totp_secret: Optional[str] = None
    category: str
    notes: Optional[str] = None
    custom_fields: Optional[dict] = None
    iv: str
    created_at: datetime
    updated_at: datetime

    @field_validator("iv", mode="before")
    @classmethod
    def _encode_iv(cls, v):
        if isinstance(v, bytes):
            return v.hex()
        return v

    class Config:
        from_attributes = True


class VaultEntryListResponse(BaseModel):
    entries: list[VaultEntryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


@router.post("", response_model=VaultEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_vault_entry(
    entry_data: VaultEntryCreate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    iv = os.urandom(12)
    entry = VaultEntry(
        user_id=current_user.id,
        title=entry_data.title,
        username=entry_data.username,
        password=entry_data.password,
        url=entry_data.url,
        totp_secret=entry_data.totp_secret,
        category=entry_data.category,
        notes=entry_data.notes,
        custom_fields=entry_data.custom_fields,
        iv=iv,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return VaultEntryResponse.model_validate(entry)


@router.get("", response_model=VaultEntryListResponse)
async def list_vault_entries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    query = select(VaultEntry).where(VaultEntry.user_id == current_user.id)

    if category:
        query = query.where(VaultEntry.category == category)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                VaultEntry.title.ilike(search_term),
                VaultEntry.username.ilike(search_term),
                VaultEntry.url.ilike(search_term),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    query = query.order_by(VaultEntry.updated_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    entries = result.scalars().all()

    total_pages = (total + page_size - 1) // page_size

    return VaultEntryListResponse(
        entries=[VaultEntryResponse.model_validate(e) for e in entries],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/categories")
async def get_categories(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    query = (
        select(VaultEntry.category, func.count(VaultEntry.id))
        .where(VaultEntry.user_id == current_user.id)
        .group_by(VaultEntry.category)
        .order_by(VaultEntry.category)
    )
    result = await db.execute(query)
    return [
        {"category": row[0], "count": row[1]}
        for row in result.all()
    ]


@router.get("/{entry_id}", response_model=VaultEntryResponse)
async def get_vault_entry(
    entry_id: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    result = await db.execute(
        select(VaultEntry).where(
            VaultEntry.id == entry_id,
            VaultEntry.user_id == current_user.id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )
    return VaultEntryResponse.model_validate(entry)


@router.patch("/{entry_id}", response_model=VaultEntryResponse)
async def update_vault_entry(
    entry_id: str,
    entry_data: VaultEntryUpdate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    result = await db.execute(
        select(VaultEntry).where(
            VaultEntry.id == entry_id,
            VaultEntry.user_id == current_user.id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    update_data = entry_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)

    await db.commit()
    await db.refresh(entry)
    return VaultEntryResponse.model_validate(entry)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vault_entry(
    entry_id: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    result = await db.execute(
        select(VaultEntry).where(
            VaultEntry.id == entry_id,
            VaultEntry.user_id == current_user.id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    await db.delete(entry)
    await db.commit()