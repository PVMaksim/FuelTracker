"""create refuels table

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-30 10:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "refuels",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("odometer", sa.Integer, nullable=False),
        sa.Column("fuel_price", sa.Numeric(8, 2), nullable=False),
        sa.Column("total_cost", sa.Numeric(10, 2), nullable=False),
        sa.Column("liters", sa.Numeric(6, 2), nullable=False),
        sa.Column("distance", sa.Integer, nullable=True),
        sa.Column("consumption", sa.Numeric(5, 2), nullable=True),
        sa.Column("local_id", sa.String(36), nullable=True, unique=True),
        sa.Column("is_synced", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("receipt_ocr_raw", sa.Text, nullable=True),
        sa.Column("notes", sa.String(500), nullable=True),
    )
    # Индексы для частых запросов
    op.create_index("ix_refuels_created_at", "refuels", ["created_at"])
    op.create_index("ix_refuels_odometer", "refuels", ["odometer"])
    op.create_index("ix_refuels_local_id", "refuels", ["local_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_refuels_local_id", table_name="refuels")
    op.drop_index("ix_refuels_odometer", table_name="refuels")
    op.drop_index("ix_refuels_created_at", table_name="refuels")
    op.drop_table("refuels")
