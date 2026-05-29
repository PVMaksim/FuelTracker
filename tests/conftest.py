"""
Shared pytest fixtures for unit and integration tests.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

# Отключаем миграции в тестах — используем create_tables()
os.environ.setdefault("RUN_MIGRATIONS", "false")
os.environ.setdefault("API_KEY", "test-key")
os.environ.setdefault("POSTGRES_DB", "test")
os.environ.setdefault("POSTGRES_USER", "test")
os.environ.setdefault("POSTGRES_PASSWORD", "test")

from src.main import app
from src.database.connection import Base, get_db
from src.database import models  # noqa: F401 — registers models

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Изолированная in-memory SQLite сессия для каждого теста."""
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    """AsyncClient с переопределённой зависимостью БД."""
    async def override_get_db():
        yield db_session
        await db_session.commit()  # Имитирует поведение оригинального get_db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"X-API-Key": "test-key"},
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def typical_refuel():
    """Данные типичной заправки для переиспользования в тестах."""
    return {
        "odometer": 79_240,
        "fuel_price": 58.5,
        "total_cost": 2_340.0,
        "expected_liters": 40.0,
        "expected_distance": 540,
        "expected_consumption": 7.41,
        "prev_odometer": 78_700,
    }
