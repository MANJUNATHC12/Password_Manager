from typing import Optional
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, Field, field_validator

from app.database import get_db_dependency
from app.auth.dependencies import get_current_user
from app.models import GroceryItem

router = APIRouter(prefix="/grocery", tags=["Grocery"])


# ─────────────────────────── Schemas ────────────────────────────

class GroceryItemCreate(BaseModel):
    month: str = Field(..., pattern=r"^\d{4}-\d{2}$")
    name: str = Field(..., min_length=1, max_length=200)
    quantity: float = Field(default=1, gt=0)
    unit: str = Field(default="pcs", max_length=20)
    category: str = Field(default="Other", max_length=50)
    estimated_price: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=500)


class GroceryItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    quantity: Optional[float] = Field(None, gt=0)
    unit: Optional[str] = Field(None, max_length=20)
    category: Optional[str] = Field(None, max_length=50)
    estimated_price: Optional[float] = Field(None, ge=0)
    is_purchased: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=500)


class GroceryItemResponse(BaseModel):
    id: UUID
    month: str
    name: str
    quantity: float
    unit: str
    category: str
    estimated_price: Optional[float] = None
    is_purchased: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @field_validator("quantity", "estimated_price", mode="before")
    @classmethod
    def _to_float(cls, v):
        return float(v) if v is not None else v

    class Config:
        from_attributes = True


class GroceryListResponse(BaseModel):
    items: list[GroceryItemResponse]
    total: int
    purchased_count: int
    remaining_count: int
    estimated_total: float


class GrocerySummaryResponse(BaseModel):
    month: str
    total: int
    purchased: int
    remaining: int
    estimated_total: float
    by_category: list[dict]


class GroceryCopyRequest(BaseModel):
    from_month: str = Field(..., pattern=r"^\d{4}-\d{2}$")
    to_month: str = Field(..., pattern=r"^\d{4}-\d{2}$")


class GroceryCopyResponse(BaseModel):
    copied: int
    items: list[GroceryItemResponse]


# ─────────────────────────── Helpers ────────────────────────────

async def _get_owned(item_id: str, user, db: AsyncSession) -> GroceryItem:
    result = await db.execute(
        select(GroceryItem).where(
            GroceryItem.id == item_id,
            GroceryItem.user_id == user.id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grocery item not found",
        )
    return item


# ─────────────────────────── Routes ────────────────────────────

@router.get("", response_model=GroceryListResponse)
async def list_grocery_items(
    month: Optional[str] = Query(None, description="Filter by month YYYY-MM"),
    category: Optional[str] = Query(None),
    is_purchased: Optional[bool] = Query(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    conditions = [GroceryItem.user_id == current_user.id]
    if month:
        conditions.append(GroceryItem.month == month)
    if category:
        conditions.append(GroceryItem.category == category)
    if is_purchased is not None:
        conditions.append(GroceryItem.is_purchased == is_purchased)

    rows = (
        await db.execute(
            select(GroceryItem)
            .where(*conditions)
            .order_by(GroceryItem.category, GroceryItem.name)
        )
    ).scalars().all()

    total = len(rows)
    purchased_count = sum(1 for r in rows if r.is_purchased)
    estimated_total = float(
        sum(
            float(r.estimated_price or 0) * float(r.quantity)
            for r in rows
        )
    )

    return GroceryListResponse(
        items=[GroceryItemResponse.model_validate(r) for r in rows],
        total=total,
        purchased_count=purchased_count,
        remaining_count=total - purchased_count,
        estimated_total=estimated_total,
    )


@router.post("", response_model=GroceryItemResponse, status_code=status.HTTP_201_CREATED)
async def create_grocery_item(
    data: GroceryItemCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    item = GroceryItem(
        user_id=current_user.id,
        month=data.month,
        name=data.name,
        quantity=data.quantity,
        unit=data.unit,
        category=data.category or "Other",
        estimated_price=data.estimated_price,
        notes=data.notes,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return GroceryItemResponse.model_validate(item)


@router.post("/batch", response_model=GroceryCopyResponse, status_code=status.HTTP_201_CREATED)
async def create_grocery_batch(
    items: list[GroceryItemCreate],
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No items provided",
        )
    created: list[GroceryItem] = []
    for data in items:
        item = GroceryItem(
            user_id=current_user.id,
            month=data.month,
            name=data.name,
            quantity=data.quantity,
            unit=data.unit,
            category=data.category or "Other",
            estimated_price=data.estimated_price,
            notes=data.notes,
        )
        db.add(item)
        created.append(item)
    await db.commit()
    for item in created:
        await db.refresh(item)
    return GroceryCopyResponse(
        copied=len(created),
        items=[GroceryItemResponse.model_validate(i) for i in created],
    )


@router.post("/copy", response_model=GroceryCopyResponse)
async def copy_grocery_month(
    data: GroceryCopyRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    """Copy all items from one month to another (resets is_purchased to False)."""
    if data.from_month == data.to_month:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source and target month must be different",
        )

    source_rows = (
        await db.execute(
            select(GroceryItem).where(
                GroceryItem.user_id == current_user.id,
                GroceryItem.month == data.from_month,
            )
        )
    ).scalars().all()

    if not source_rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No grocery items found for {data.from_month}",
        )

    created: list[GroceryItem] = []
    for src in source_rows:
        new_item = GroceryItem(
            user_id=current_user.id,
            month=data.to_month,
            name=src.name,
            quantity=src.quantity,
            unit=src.unit,
            category=src.category,
            estimated_price=src.estimated_price,
            is_purchased=False,
            notes=src.notes,
        )
        db.add(new_item)
        created.append(new_item)

    await db.commit()
    for item in created:
        await db.refresh(item)

    return GroceryCopyResponse(
        copied=len(created),
        items=[GroceryItemResponse.model_validate(i) for i in created],
    )


@router.get("/summary", response_model=GrocerySummaryResponse)
async def grocery_summary(
    month: Optional[str] = Query(None, description="Month YYYY-MM, defaults to current"),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    if not month:
        from datetime import date
        today = date.today()
        month = f"{today.year:04d}-{today.month:02d}"

    rows = (
        await db.execute(
            select(GroceryItem).where(
                GroceryItem.user_id == current_user.id,
                GroceryItem.month == month,
            )
        )
    ).scalars().all()

    total = len(rows)
    purchased = sum(1 for r in rows if r.is_purchased)
    estimated_total = float(
        sum(float(r.estimated_price or 0) * float(r.quantity) for r in rows)
    )

    # Group by category
    cat_map: dict[str, dict] = {}
    for r in rows:
        cat = r.category
        if cat not in cat_map:
            cat_map[cat] = {"category": cat, "total": 0, "count": 0, "purchased": 0}
        cat_map[cat]["count"] += 1
        cat_map[cat]["total"] += float(r.estimated_price or 0) * float(r.quantity)
        if r.is_purchased:
            cat_map[cat]["purchased"] += 1

    by_category = sorted(cat_map.values(), key=lambda x: x["total"], reverse=True)

    return GrocerySummaryResponse(
        month=month,
        total=total,
        purchased=purchased,
        remaining=total - purchased,
        estimated_total=estimated_total,
        by_category=by_category,
    )


@router.get("/{item_id}", response_model=GroceryItemResponse)
async def get_grocery_item(
    item_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    item = await _get_owned(item_id, current_user, db)
    return GroceryItemResponse.model_validate(item)


@router.patch("/{item_id}", response_model=GroceryItemResponse)
async def update_grocery_item(
    item_id: str,
    data: GroceryItemUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    item = await _get_owned(item_id, current_user, db)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "category" and not value:
            value = "Other"
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return GroceryItemResponse.model_validate(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_grocery_item(
    item_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    item = await _get_owned(item_id, current_user, db)
    await db.delete(item)
    await db.commit()
