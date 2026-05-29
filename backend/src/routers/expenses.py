"""Expenses CRUD — Ремонт и Прочее расходы по машине."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.connection import get_db
from src.database.models import Expense, EXPENSE_CATEGORIES
from src.routers.refuels import verify_api_key

router = APIRouter(tags=["expenses"])


class ExpenseCreate(BaseModel):
    amount: float
    category: str = "other"
    description: str | None = None
    is_part: bool = False
    car_id: str | None = None
    created_at: datetime | None = None

    @field_validator("amount")
    @classmethod
    def positive_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Сумма должна быть больше нуля")
        return v

    @field_validator("category")
    @classmethod
    def valid_category(cls, v: str) -> str:
        return v if v in EXPENSE_CATEGORIES else "other"


class ExpenseBulkCreate(BaseModel):
    """Массовое добавление позиций (из OCR чека)."""
    items: list[ExpenseCreate]
    car_id: str | None = None


class ExpenseResponse(BaseModel):
    id: str
    car_id: str | None
    created_at: datetime
    amount: float
    category: str
    description: str | None
    is_part: bool

    model_config = {"from_attributes": True}


class ExpenseStats(BaseModel):
    total: float
    total_parts: float
    total_labor: float
    total_other: float


@router.get("/expenses", response_model=list[ExpenseResponse])
async def list_expenses(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
    car_id: str | None = None,
    filter: str | None = None,  # "parts" | "labor" | None
    limit: int = 100,
):
    query = select(Expense).order_by(desc(Expense.created_at)).limit(limit)
    if car_id:
        query = query.where(Expense.car_id == car_id)
    if filter == "parts":
        query = query.where(Expense.is_part == True)
    elif filter == "labor":
        query = query.where(Expense.is_part == False, Expense.category == "repair")
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    data: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    expense = Expense(
        car_id=data.car_id, amount=data.amount, category=data.category,
        description=data.description, is_part=data.is_part,
        created_at=data.created_at or datetime.now(timezone.utc),
    )
    db.add(expense)
    await db.flush()
    return expense


@router.post("/expenses/bulk", response_model=list[ExpenseResponse], status_code=status.HTTP_201_CREATED)
async def create_expenses_bulk(
    data: ExpenseBulkCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    """Добавить несколько позиций сразу (из OCR чека ремонта)."""
    created = []
    for item in data.items:
        expense = Expense(
            car_id=data.car_id or item.car_id,
            amount=item.amount, category=item.category,
            description=item.description, is_part=item.is_part,
            created_at=item.created_at or datetime.now(timezone.utc),
        )
        db.add(expense)
        await db.flush()
        created.append(expense)
    return created


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    await db.delete(expense)


@router.get("/expenses/stats", response_model=ExpenseStats)
async def expense_stats(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
    car_id: str | None = None,
):
    query = select(Expense.category, Expense.is_part, func.sum(Expense.amount).label("total"))
    if car_id:
        query = query.where(Expense.car_id == car_id)
    query = query.group_by(Expense.category, Expense.is_part)
    result = await db.execute(query)
    rows = result.all()

    total_parts = sum(float(r.total) for r in rows if r.is_part)
    total_labor = sum(float(r.total) for r in rows if not r.is_part and r.category == "repair")
    total_other = sum(float(r.total) for r in rows if r.category == "other")
    total = total_parts + total_labor + total_other

    return ExpenseStats(total=total, total_parts=total_parts,
                        total_labor=total_labor, total_other=total_other)
