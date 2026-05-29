"""
Database connection and session management.
Подключение к БД и управление сессиями.

Миграции схемы управляются Alembic (``alembic upgrade head``).
Не использовать ``create_tables()`` на production — только в тестах.
"""
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from src.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — provides DB session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def check_db_connection() -> bool:
    """Check database availability with a lightweight query.

    Returns:
        ``True`` если БД доступна, ``False`` при ошибке подключения.
    """
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def create_tables() -> None:
    """Create tables directly from metadata.

    Warning:
        Только для тестов и локальной разработки.
        На production использовать ``alembic upgrade head``.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
