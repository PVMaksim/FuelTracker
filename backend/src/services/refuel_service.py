"""
Business logic for creating refuel records.
Вынесено из роутера для переиспользования в bulk_sync и тестах.
"""
import logging
from datetime import datetime, timezone

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func as sql_func

from src.config import settings
from src.database.models import Refuel, Car
from src.services.calculations import (
    calculate_consumption, calculate_cost_per_km,
    calculate_distance, calculate_liters,
)
from src.services.notifications import notify_telegram

log = logging.getLogger(__name__)


class OdometerTooLowError(ValueError):
    def __init__(self, min_odometer: int):
        self.min_odometer = min_odometer
        super().__init__(f"Пробег должен быть больше {min_odometer} км (последний сохранённый)")


async def get_last_odometer(
    db: AsyncSession,
    car_id: str | None = None,
    exclude_id: str | None = None,
) -> int | None:
    """Get max odometer for a specific car (or global if no car_id)."""
    query = select(sql_func.max(Refuel.odometer))
    if car_id:
        query = query.where(Refuel.car_id == car_id)
    if exclude_id:
        query = query.where(Refuel.id != exclude_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def _check_service_reminder(odometer: int, prev_odometer: int | None) -> None:
    interval = settings.service_interval_km
    if not interval or prev_odometer is None:
        return
    if odometer // interval > prev_odometer // interval:
        milestone_km = (odometer // interval) * interval
        await notify_telegram(
            f"🔧 <b>Пора на ТО!</b>\nПробег достиг <b>{milestone_km:,} км</b>.\n"
            f"Текущий пробег: {odometer:,} км"
        )


async def create_refuel_record(
    db: AsyncSession,
    *,
    odometer: int,
    fuel_price: float,
    total_cost: float,
    car_id: str | None = None,
    fuel_type: str | None = None,
    local_id: str | None = None,
    notes: str | None = None,
    created_at: datetime | None = None,
    exclude_id: str | None = None,
) -> Refuel:
    """Create refuel, compute all derived fields, update car's last_fuel_type."""
    last_odometer = await get_last_odometer(db, car_id=car_id, exclude_id=exclude_id)

    # Для машины без заправок используем её начальный пробег
    if last_odometer is None and car_id:
        car_result = await db.execute(select(Car).where(Car.id == car_id))
        car = car_result.scalar_one_or_none()
        if car:
            last_odometer = car.initial_odometer or None

    min_odometer = last_odometer or settings.initial_odometer
    if odometer <= min_odometer:
        raise OdometerTooLowError(min_odometer)

    liters      = calculate_liters(total_cost, fuel_price)
    distance    = calculate_distance(odometer, last_odometer)
    consumption = calculate_consumption(liters, distance)
    cost_per_km = calculate_cost_per_km(total_cost, distance)

    try:
        await _check_service_reminder(odometer, last_odometer)
    except Exception as e:
        log.warning("Service reminder failed: %s", e)

    # Обновить последний тип топлива для машины
    if car_id and fuel_type:
        car_result = await db.execute(select(Car).where(Car.id == car_id))
        car = car_result.scalar_one_or_none()
        if car:
            car.last_fuel_type = fuel_type

    refuel = Refuel(
        car_id      = car_id,
        odometer    = odometer,
        fuel_price  = fuel_price,
        total_cost  = total_cost,
        fuel_type   = fuel_type,
        liters      = liters,
        distance    = distance,
        consumption = consumption,
        cost_per_km = cost_per_km,
        local_id    = local_id,
        notes       = notes,
        created_at  = created_at or datetime.now(timezone.utc),
    )
    db.add(refuel)
    await db.flush()
    return refuel
