"""add fuel_type and cost_per_km columns

Revision ID: 0002_fuel_type_cost_per_km
Revises: 0001_initial
Create Date: 2026-04-30 11:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_fuel_type_cost_per_km"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Тип топлива (92/95/98/diesel) — nullable, старые записи останутся NULL
    op.add_column(
        "refuels",
        sa.Column(
            "fuel_type",
            sa.String(10),
            nullable=True,
            comment="Тип топлива: 92, 95, 98, diesel",
        ),
    )
    # Стоимость за км = total_cost / distance — вычисляется и кэшируется
    op.add_column(
        "refuels",
        sa.Column(
            "cost_per_km",
            sa.Numeric(8, 2),
            nullable=True,
            comment="Стоимость рублей за 1 км пробега",
        ),
    )


def downgrade() -> None:
    op.drop_column("refuels", "cost_per_km")
    op.drop_column("refuels", "fuel_type")
