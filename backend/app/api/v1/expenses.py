from typing import Optional
from datetime import datetime, date
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, Field, field_validator

from app.database import get_db_dependency
from app.auth.dependencies import get_current_user
from app.models import Expense

router = APIRouter(prefix="/expenses", tags=["Expenses"])


class ExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0)
    category: str = Field(default="Other", max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    payment_method: Optional[str] = Field(None, max_length=50)
    spent_on: date


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    payment_method: Optional[str] = Field(None, max_length=50)
    spent_on: Optional[date] = None


class ExpenseResponse(BaseModel):
    id: UUID
    amount: float
    category: str
    description: Optional[str] = None
    payment_method: Optional[str] = None
    spent_on: date
    created_at: datetime
    updated_at: datetime

    @field_validator("amount", mode="before")
    @classmethod
    def _to_float(cls, v):
        return float(v) if v is not None else v

    class Config:
        from_attributes = True


class ExpenseListResponse(BaseModel):
    entries: list[ExpenseResponse]
    total: int
    total_amount: float
    page: int
    page_size: int
    total_pages: int


class CategoryBreakdown(BaseModel):
    category: str
    total: float
    count: int


class ExpenseSummaryResponse(BaseModel):
    month: str
    total: float
    count: int
    by_category: list[CategoryBreakdown]


def _month_range(month: str) -> tuple[date, date]:
    try:
        y_str, m_str = month.split("-")
        y, m = int(y_str), int(m_str)
        if not (1 <= m <= 12):
            raise ValueError
        start = date(y, m, 1)
        end = date(y + 1, 1, 1) if m == 12 else date(y, m + 1, 1)
        return start, end
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month format, expected YYYY-MM",
        )


async def _get_owned(expense_id: str, user, db: AsyncSession) -> Expense:
    result = await db.execute(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.user_id == user.id,
        )
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )
    return expense


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    data: ExpenseCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    expense = Expense(
        user_id=current_user.id,
        amount=data.amount,
        category=data.category or "Other",
        description=data.description,
        payment_method=data.payment_method,
        spent_on=data.spent_on,
    )
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return ExpenseResponse.model_validate(expense)


@router.get("", response_model=ExpenseListResponse)
async def list_expenses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    month: Optional[str] = Query(None, description="Filter by month, format YYYY-MM"),
    category: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    conditions = [Expense.user_id == current_user.id]
    if month:
        start, end = _month_range(month)
        conditions += [Expense.spent_on >= start, Expense.spent_on < end]
    if category:
        conditions.append(Expense.category == category)

    base = select(Expense).where(*conditions)
    total = await db.scalar(select(func.count()).select_from(base.subquery())) or 0
    total_amount = float(
        await db.scalar(
            select(func.coalesce(func.sum(Expense.amount), 0)).where(*conditions)
        )
        or 0
    )

    rows = (
        await db.execute(
            base.order_by(Expense.spent_on.desc(), Expense.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).scalars().all()

    total_pages = (total + page_size - 1) // page_size
    return ExpenseListResponse(
        entries=[ExpenseResponse.model_validate(e) for e in rows],
        total=total,
        total_amount=total_amount,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


class ExpenseBatchItem(BaseModel):
    amount: float = Field(..., gt=0)
    category: str = Field(default="Other", max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    payment_method: Optional[str] = Field(None, max_length=50)
    spent_on: date


class ExpenseBatchResponse(BaseModel):
    created: int
    expenses: list[ExpenseResponse]


@router.post("/batch", response_model=ExpenseBatchResponse)
async def create_expenses_batch(
    items: list[ExpenseBatchItem],
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No expenses provided",
        )
    if len(items) > 1000:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Too many expenses in one batch (max 1000)",
        )

    created: list[Expense] = []

    for item in items:
        expense = Expense(
            user_id=current_user.id,
            amount=item.amount,
            category=item.category or "Other",
            description=item.description,
            payment_method=item.payment_method,
            spent_on=item.spent_on,
        )
        db.add(expense)
        created.append(expense)
    await db.commit()
    for expense in created:
        await db.refresh(expense)

    return ExpenseBatchResponse(
        created=len(created),
        expenses=[ExpenseResponse.model_validate(e) for e in created],
    )


@router.get("/summary", response_model=ExpenseSummaryResponse)
async def expense_summary(
    month: Optional[str] = Query(None, description="Month to summarize, format YYYY-MM"),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    if not month:
        today = date.today()
        month = f"{today.year:04d}-{today.month:02d}"
    start, end = _month_range(month)
    conditions = [
        Expense.user_id == current_user.id,
        Expense.spent_on >= start,
        Expense.spent_on < end,
    ]

    total = float(
        await db.scalar(
            select(func.coalesce(func.sum(Expense.amount), 0)).where(*conditions)
        )
        or 0
    )
    count = await db.scalar(
        select(func.count()).select_from(select(Expense).where(*conditions).subquery())
    ) or 0

    cat_rows = (
        await db.execute(
            select(
                Expense.category,
                func.sum(Expense.amount),
                func.count(Expense.id),
            )
            .where(*conditions)
            .group_by(Expense.category)
            .order_by(func.sum(Expense.amount).desc())
        )
    ).all()

    by_category = [
        CategoryBreakdown(category=r[0], total=float(r[1]), count=r[2])
        for r in cat_rows
    ]
    return ExpenseSummaryResponse(
        month=month, total=total, count=count, by_category=by_category
    )


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    expense = await _get_owned(expense_id, current_user, db)
    return ExpenseResponse.model_validate(expense)


@router.patch("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    data: ExpenseUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    expense = await _get_owned(expense_id, current_user, db)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "category" and not value:
            value = "Other"
        setattr(expense, field, value)
    await db.commit()
    await db.refresh(expense)
    return ExpenseResponse.model_validate(expense)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    expense = await _get_owned(expense_id, current_user, db)
    await db.delete(expense)
    await db.commit()
