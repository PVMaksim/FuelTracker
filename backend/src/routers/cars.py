"""
Cars CRUD endpoints.
Управление автомобилями — создание, список, обновление, удаление.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.database.connection import get_db
from src.database.models import Car
from src.routers.refuels import verify_api_key

router = APIRouter(tags=["cars"])


class CarCreate(BaseModel):
    name: str
    initial_odometer: int = 0


class CarUpdate(BaseModel):
    name: str | None = None
    initial_odometer: int | None = None
    last_fuel_type: str | None = None


class CarResponse(BaseModel):
    id: str
    name: str
    initial_odometer: int
    last_fuel_type: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/cars", response_model=list[CarResponse])
async def list_cars(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    """Получить список всех автомобилей."""
    result = await db.execute(select(Car).order_by(Car.created_at))
    return result.scalars().all()


@router.post("/cars", response_model=CarResponse, status_code=status.HTTP_201_CREATED)
async def create_car(
    data: CarCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    """Создать новый автомобиль."""
    car = Car(name=data.name, initial_odometer=data.initial_odometer)
    db.add(car)
    await db.flush()
    return car


@router.put("/cars/{car_id}", response_model=CarResponse)
async def update_car(
    car_id: str,
    data: CarUpdate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    """Обновить название или параметры автомобиля."""
    result = await db.execute(select(Car).where(Car.id == car_id))
    car = result.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Автомобиль не найден")
    if data.name is not None:
        car.name = data.name
    if data.initial_odometer is not None:
        car.initial_odometer = data.initial_odometer
    if data.last_fuel_type is not None:
        car.last_fuel_type = data.last_fuel_type
    await db.flush()
    return car


@router.delete("/cars/{car_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_car(
    car_id: str,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    """Удалить автомобиль (и все его заправки)."""
    result = await db.execute(select(Car).where(Car.id == car_id))
    car = result.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Автомобиль не найден")
    await db.delete(car)
