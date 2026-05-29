"""
Statistics endpoints.
Эндпоинты для получения статистики и данных для графиков.
"""
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, func, desc, extract
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.database.connection import get_db
from src.database.models import Refuel, Car
from src.routers.refuels import verify_api_key

router = APIRouter(tags=["stats"])


class MonthlyData(BaseModel):
    month: str                    # "2026-04"
    total_cost: float
    total_liters: float
    avg_consumption: float | None


class StatsResponse(BaseModel):
    total_refuels: int
    total_cost: float
    total_liters: float
    avg_consumption: float | None
    avg_consumption_30d: float | None
    last_odometer: int | None
    last_fuel_price: float | None
    chart_data: list[dict]
    monthly_data: list[MonthlyData]


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
    car_id: str | None = None,
):
    """Получить полную статистику: расход, суммы, график, разбивка по месяцам."""

    # Общая статистика
    # Базовый фильтр по машине
    car_filter = [Refuel.car_id == car_id] if car_id else []

    totals = await db.execute(
        select(
            func.count(Refuel.id),
            func.sum(Refuel.total_cost),
            func.sum(Refuel.liters),
            func.avg(Refuel.consumption),
        ).where(*car_filter)
    )
    count, total_cost, total_liters, avg_consumption = totals.one()

    # Средний расход за 30 дней
    since = datetime.now(timezone.utc) - timedelta(days=30)
    avg_30d = await db.execute(
        select(func.avg(Refuel.consumption))
        .where(Refuel.created_at >= since)
        .where(Refuel.consumption.is_not(None))
    )
    avg_consumption_30d = avg_30d.scalar_one_or_none()

    # Последние значения для подсказок в форме
    last_row = await db.execute(
        select(Refuel.odometer, Refuel.fuel_price)
        .where(*car_filter)
        .order_by(desc(Refuel.created_at))
        .limit(1)
    )
    last = last_row.one_or_none()

    # Данные для графика расхода (последние 30 записей с consumption)
    chart_rows = await db.execute(
        select(Refuel.created_at, Refuel.consumption, Refuel.odometer)
        .where(Refuel.consumption.is_not(None))
        .order_by(Refuel.created_at)
        .limit(30)
    )
    chart_data = [
        {
            "date": row.created_at.strftime("%d.%m.%Y"),
            "consumption": float(row.consumption),
            "odometer": row.odometer,
        }
        for row in chart_rows
    ]

    # Статистика по месяцам (PostgreSQL: extract year/month)
    monthly_rows = await db.execute(
        select(
            extract("year",  Refuel.created_at).label("year"),
            extract("month", Refuel.created_at).label("month"),
            func.sum(Refuel.total_cost).label("total_cost"),
            func.sum(Refuel.liters).label("total_liters"),
            func.avg(Refuel.consumption).label("avg_consumption"),
        )
        .group_by("year", "month")
        .order_by("year", "month")
    )
    monthly_data = [
        MonthlyData(
            month=f"{int(row.year)}-{int(row.month):02d}",
            total_cost=float(row.total_cost or 0),
            total_liters=float(row.total_liters or 0),
            avg_consumption=round(float(row.avg_consumption), 2) if row.avg_consumption else None,
        )
        for row in monthly_rows
    ]

    return StatsResponse(
        total_refuels=count or 0,
        total_cost=float(total_cost or 0),
        total_liters=float(total_liters or 0),
        avg_consumption=round(float(avg_consumption), 2) if avg_consumption else None,
        avg_consumption_30d=round(float(avg_consumption_30d), 2) if avg_consumption_30d else None,
        last_odometer=last.odometer if last else (
            (await db.execute(select(Car.initial_odometer).where(Car.id == car_id))).scalar_one_or_none()
            if car_id else settings.initial_odometer
        ),
        last_fuel_price=float(last.fuel_price) if last else None,
        chart_data=chart_data,
        monthly_data=monthly_data,
    )
