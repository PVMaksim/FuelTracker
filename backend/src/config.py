"""
Application configuration.

Все настройки загружаются исключительно из переменных окружения через Pydantic Settings.
Шаблон: ``.env.example``.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Attributes:
        postgres_db: Имя базы данных PostgreSQL.
        postgres_user: Пользователь PostgreSQL.
        postgres_password: Пароль PostgreSQL.
        postgres_host: Хост PostgreSQL. По умолчанию ``db``.
        postgres_port: Порт PostgreSQL.
        api_key: Статический ключ для ``X-API-Key``.
        anthropic_api_key: Ключ Anthropic API для OCR чеков.
        admin_telegram_id: Telegram ID разработчика для алертов.
        telegram_bot_token: Токен Telegram-бота для алертов.
        debug: Включает Swagger UI и подробные SQL-логи.
        run_migrations: Запускать Alembic при старте. Отключить в тестах.
        service_interval_km: Пробег между ТО (км). 0 — отключить уведомления.
        initial_odometer: Начальный пробег при первом запуске (из Numbers).
        car_name: Название автомобиля.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # База данных
    postgres_db: str = "fuel_tracker"
    postgres_user: str = "fuel_user"
    postgres_password: str = "changeme"
    postgres_host: str = "db"
    postgres_port: int = 5432

    # Безопасность
    api_key: str = "dev-key"

    # Anthropic OCR
    anthropic_api_key: str = ""

    # Telegram-уведомления
    admin_telegram_id: int = 0
    telegram_bot_token: str = ""

    # Приложение
    debug: bool = False
    run_migrations: bool = True      # False в тестах — там create_tables()
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:9090"]

    # Напоминание о ТО
    service_interval_km: int = 10000
    ocr_model: str = "google/gemini-2.5-flash-image"  # 0 = отключить

    # Данные автомобиля
    initial_odometer: int = 78700
    car_name: str = "Fielder"

    @property
    def database_url(self) -> str:
        """Build async PostgreSQL connection URL."""
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
