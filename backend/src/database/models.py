"""
SQLAlchemy ORM models for FuelTracker.

Содержит единственную модель ``Refuel`` — запись о заправке автомобиля.
Схема версионируется через Alembic (``src/database/migrations/``).
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from src.database.connection import Base

FUEL_TYPES = ("92", "95", "98", "diesel")


class Refuel(Base):
    """ORM model representing a single fuel refueling event.

    Attributes:
        id: UUID первичный ключ.
        created_at: Дата и время заправки (UTC). Индексировано.
        odometer: Пробег в км. Индексировано.
        fuel_price: Цена за литр (₽).
        total_cost: Сумма заправки (₽).
        liters: Литров = ``total_cost / fuel_price``.
        distance: Пробег с предыдущей заправки. ``None`` для первой записи.
        consumption: Расход л/100км. ``None`` для первой записи.
        cost_per_km: Стоимость ₽/км = ``total_cost / distance``.
        fuel_type: Тип топлива: ``92``, ``95``, ``98``, ``diesel``.
        local_id: Клиентский UUID для дедупликации при офлайн-sync. Уникальный.
        is_synced: Всегда ``True`` для записей созданных через API.
        receipt_ocr_raw: Сырой ответ Claude API (для отладки OCR).
        notes: Заметка пользователя (до 500 символов).
    """

    __tablename__ = "refuels"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    odometer: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    fuel_price: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    total_cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    liters: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    distance: Mapped[int | None] = mapped_column(Integer, nullable=True)
    consumption: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    cost_per_km: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    fuel_type: Mapped[str | None] = mapped_column(String(10), nullable=True)
    local_id: Mapped[str | None] = mapped_column(String(36), nullable=True, unique=True, index=True)
    car_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    is_synced: Mapped[bool] = mapped_column(Boolean, default=True)
    receipt_ocr_raw: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_part: Mapped[bool] = mapped_column(Boolean, default=False)


class Car(Base):
    """ORM model representing a car being tracked.

    Attributes:
        id: UUID первичный ключ.
        name: Название автомобиля (напр. "Fielder").
        initial_odometer: Начальный пробег при создании.
        last_fuel_type: Последний использованный тип топлива.
        created_at: Дата создания.
    """

    __tablename__ = "cars"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    initial_odometer: Mapped[int] = mapped_column(Integer, default=0)
    last_fuel_type: Mapped[str | None] = mapped_column(String(10), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


EXPENSE_CATEGORIES = ("repair", "other")


class Expense(Base):
    """ORM model for car expenses (non-fuel)."""

    __tablename__ = "expenses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    car_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False, default="other")
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_part: Mapped[bool] = mapped_column(Boolean, default=False)
