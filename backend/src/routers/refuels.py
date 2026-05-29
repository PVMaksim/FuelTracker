"""
Refuels CRUD endpoints.
Логика вынесена в ``src.services.refuel_service``.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel, field_validator
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.connection import get_db
from src.database.models import Refuel, FUEL_TYPES
from src.services.calculations import (
    calculate_liters, calculate_consumption,
    calculate_distance, calculate_cost_per_km,
)
from src.services.refuel_service import (
    create_refuel_record, get_last_odometer, OdometerTooLowError,
)
from src.config import settings

router = APIRouter(tags=["refuels"])
api_key_header = APIKeyHeader(name="X-API-Key")


async def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    """Проверка статического API-ключа из заголовка X-API-Key."""
    if api_key != settings.api_key:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key


# ── Схемы ──────────────────────────────────────────────────────────────────

class RefuelCreate(BaseModel):
    odometer: int
    fuel_price: float
    total_cost: float
    car_id: str | None = None
    fuel_type: str | None = None
    local_id: str | None = None
    notes: str | None = None
    created_at: datetime | None = None

    @field_validator("odometer")
    @classmethod
    def odometer_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Пробег должен быть положительным числом")
        return v

    @field_validator("fuel_price", "total_cost")
    @classmethod
    def positive_number(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Значение должно быть больше нуля")
        return v

    @field_validator("fuel_type")
    @classmethod
    def valid_fuel_type(cls, v: str | None) -> str | None:
        if v is not None and v not in FUEL_TYPES:
            raise ValueError(f"Тип топлива: {', '.join(FUEL_TYPES)}")
        return v


class RefuelUpdate(BaseModel):
    odometer: int | None = None
    fuel_price: float | None = None
    total_cost: float | None = None
    fuel_type: str | None = None
    notes: str | None = None


class RefuelResponse(BaseModel):
    id: str
    created_at: datetime
    odometer: int
    fuel_price: float
    total_cost: float
    liters: float
    distance: int | None
    consumption: float | None
    cost_per_km: float | None
    car_id: str | None
    fuel_type: str | None
    local_id: str | None
    notes: str | None

    model_config = {"from_attributes": True}


# ── Эндпоинты ─────────────────────────────────────────────────────────────

@router.get("/refuels", response_model=list[RefuelResponse])
async def list_refuels(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
    limit: int = 50,
    offset: int = 0,
):
    """Получить список заправок (последние сначала)."""
    result = await db.execute(
        select(Refuel).order_by(desc(Refuel.created_at)).limit(limit).offset(offset)
    )
    return result.scalars().all()


@router.post("/refuels", response_model=RefuelResponse, status_code=status.HTTP_201_CREATED)
async def create_refuel(
    data: RefuelCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    """Создать запись заправки. Расчёты — автоматически."""
    try:
        return await create_refuel_record(
            db,
            odometer=data.odometer, fuel_price=data.fuel_price,
            total_cost=data.total_cost, car_id=data.car_id,
            fuel_type=data.fuel_type,
            local_id=data.local_id, notes=data.notes, created_at=data.created_at,
        )
    except OdometerTooLowError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.put("/refuels/{refuel_id}", response_model=RefuelResponse)
async def update_refuel(
    refuel_id: str,
    data: RefuelUpdate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    """Обновить запись, пересчитать производные поля."""
    result = await db.execute(select(Refuel).where(Refuel.id == refuel_id))
    refuel = result.scalar_one_or_none()
    if not refuel:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    if data.odometer   is not None: refuel.odometer   = data.odometer
    if data.fuel_price is not None: refuel.fuel_price = data.fuel_price
    if data.total_cost is not None: refuel.total_cost = data.total_cost
    if data.fuel_type  is not None: refuel.fuel_type  = data.fuel_type
    if data.notes      is not None: refuel.notes      = data.notes

    prev = await get_last_odometer(db, exclude_id=refuel_id)
    liters          = calculate_liters(float(refuel.total_cost), float(refuel.fuel_price))
    distance        = calculate_distance(refuel.odometer, prev)
    refuel.liters      = liters
    refuel.distance    = distance
    refuel.consumption = calculate_consumption(liters, distance)
    refuel.cost_per_km = calculate_cost_per_km(float(refuel.total_cost), distance)

    await db.flush()
    return refuel


@router.post("/refuels/bulk", response_model=list[dict])
async def bulk_sync(
    items: list[RefuelCreate],
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    """Массовая офлайн-синхронизация. Дедупликация по local_id."""
    results = []
    for item in items:
        if item.local_id:
            exists = await db.execute(
                select(Refuel.id).where(Refuel.local_id == item.local_id)
            )
            if exists.scalar_one_or_none():
                results.append({"local_id": item.local_id, "status": "skipped"})
                continue
        try:
            refuel = await create_refuel_record(
                db,
                odometer=item.odometer, fuel_price=item.fuel_price,
                total_cost=item.total_cost, fuel_type=item.fuel_type,
                local_id=item.local_id, notes=item.notes, created_at=item.created_at,
            )
            results.append({"local_id": item.local_id, "server_id": refuel.id, "status": "created"})
        except OdometerTooLowError as e:
            results.append({"local_id": item.local_id, "status": "error", "detail": str(e)})
    return results


@router.delete("/refuels/{refuel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_refuel(
    refuel_id: str,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    """Удалить запись о заправке."""
    result = await db.execute(select(Refuel).where(Refuel.id == refuel_id))
    refuel = result.scalar_one_or_none()
    if not refuel:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    await db.delete(refuel)
