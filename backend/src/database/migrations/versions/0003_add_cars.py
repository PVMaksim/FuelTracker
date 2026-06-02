"""add cars table and car_id to refuels

Revision ID: 0003_add_cars
Revises: 0002_fuel_type_cost_per_km
Create Date: 2026-05-05
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003_add_cars"
down_revision: str | None = "0002_fuel_type_cost_per_km"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "cars",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("initial_odometer", sa.Integer, nullable=False, server_default="0"),
        sa.Column("last_fuel_type", sa.String(10), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.add_column("refuels", sa.Column("car_id", sa.String(36), nullable=True))


def downgrade() -> None:
    op.drop_column("refuels", "car_id")
    op.drop_table("cars")
