"""add expenses table

Revision ID: 0004_add_expenses
Revises: 0003_add_cars
Create Date: 2026-05-15
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_add_expenses"
down_revision: str | None = "0003_add_cars"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "expenses",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("car_id", sa.String(36), nullable=True, index=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), index=True
        ),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("category", sa.String(20), nullable=False, server_default="other"),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("notes", sa.String(500), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("expenses")
