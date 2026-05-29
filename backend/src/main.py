"""FuelTracker — Backend API entry point."""
import logging
import subprocess
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from src.config import settings
from src.database.connection import check_db_connection, create_tables
from src.routers import cars, expenses, export, ocr, refuels, stats
from src.services.notifications import notify_telegram

log = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.run_migrations:
        log.info("Running Alembic migrations...")
        result = subprocess.run(["alembic", "upgrade", "head"], capture_output=True, text=True)
        if result.returncode != 0:
            log.error("Alembic migration failed:\n%s", result.stderr)
            await notify_telegram(f"🔴 Alembic migration failed:\n{result.stderr[:500]}")
            raise RuntimeError("Database migration failed — aborting startup")
        log.info("Migrations applied successfully")
    else:
        # Локальная разработка — создаём таблицы напрямую
        await create_tables()
    yield


app = FastAPI(
    title="FuelTracker API",
    version="1.2.0",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.debug else None,
    redoc_url=None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cars.router,    prefix="/api/v1")
app.include_router(expenses.router, prefix="/api/v1")
app.include_router(refuels.router, prefix="/api/v1")
app.include_router(stats.router,   prefix="/api/v1")
app.include_router(export.router,  prefix="/api/v1")
app.include_router(ocr.router,     prefix="/api/v1")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    await notify_telegram(
        f"💥 Необработанная ошибка\nURL: {request.url}\n{str(exc)[:400]}"
    )
    return JSONResponse(status_code=500, content={"detail": "Внутренняя ошибка сервера"})


@app.get("/api/health")
async def health_check():
    db_ok = await check_db_connection()
    if not db_ok:
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "database": "unavailable", "version": "1.2.0"},
        )
    return {"status": "ok", "database": "ok", "version": "1.2.0"}
