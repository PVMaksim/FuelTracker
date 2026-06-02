"""add is_part to expenses, simplify categories

Revision ID: 0005_expenses_is_part
Revises: 0004_add_expenses
Create Date: 2026-05-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005_expenses_is_part"
down_revision: str | None = "0004_add_expenses"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "expenses", sa.Column("is_part", sa.Boolean, nullable=False, server_default="false")
    )
    # Упрощаем категории — старые ТО/мойка/страховка → repair
    op.execute("UPDATE expenses SET category = 'repair' WHERE category NOT IN ('repair', 'other')")


def downgrade() -> None:
    op.drop_column("expenses", "is_part")
