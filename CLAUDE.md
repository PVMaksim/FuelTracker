# CLAUDE.md — FuelTracker

## Стек

| Слой | Технология | Версия |
|------|------------|--------|
| Frontend | Next.js (App Router) | 14.2.3 |
| Язык фронтенда | TypeScript | 5 |
| Стили | Tailwind CSS | 3 |
| Офлайн БД | Dexie.js (IndexedDB) | 3 |
| Service Worker | next-pwa | 5 |
| Графики | Recharts | 2 |
| Backend | FastAPI | 0.111.0 |
| Язык бэкенда | Python | 3.12 |
| ORM | SQLAlchemy (async) | 2.0.30 |
| Миграции | Alembic | 1.13.1 |
| БД | PostgreSQL | 16-alpine |
| OCR | Anthropic Claude API | 0.28.0 |
| Rate limiting | slowapi | 0.1.9 |
| Инфраструктура | Docker Compose, Nginx, Certbot | — |
| CI/CD | GitHub Actions | — |
| Хостинг | VPS Ubuntu 22.04 | — |

## Архитектура

PWA-приложение для трекинга расходов на топливо. Устанавливается на iPhone через Safari → «На экран Домой» без App Store.

**Паттерн офлайн-first:** каждая заправка сначала пишется в IndexedDB браузера, затем синхронизируется с FastAPI-бэкендом. При потере сети данные не теряются.

**Слои бэкенда:**
```
HTTP Request → FastAPI Router (валидация)
             → Service Layer (бизнес-логика, расчёты, уведомления)
             → SQLAlchemy ORM
             → PostgreSQL 16
```

**Ключевые модули:**
- `backend/src/services/refuel_service.py` — вся логика создания заправки, OdometerTooLowError, напоминание о ТО
- `backend/src/services/calculations.py` — формулы расчёта (зеркалируется в frontend/lib/calculations.ts)
- `frontend/lib/sync.ts` — офлайн-first сохранение и массовая синхронизация
- `frontend/components/SyncProvider.tsx` — React-контекст онлайн/офлайн статуса

## Ключевые константы

```python
INITIAL_ODOMETER = 78700   # начальный пробег из Numbers
CAR_NAME = "Fielder"        # Toyota Fielder
FUEL_TYPES = ("92", "95", "98", "diesel")
SERVICE_INTERVAL_KM = 10000 # порог уведомления о ТО (из .env)
```

## API

Базовый URL: `/api/v1`. Аутентификация: заголовок `X-API-Key`.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/health` | Health check + проверка БД |
| GET | `/api/v1/refuels` | Список заправок |
| POST | `/api/v1/refuels` | Создать (расчёты авто) |
| PUT | `/api/v1/refuels/{id}` | Редактировать + пересчитать |
| DELETE | `/api/v1/refuels/{id}` | Удалить |
| POST | `/api/v1/refuels/bulk` | Офлайн-синхронизация |
| GET | `/api/v1/stats` | Статистика + monthly_data |
| GET | `/api/v1/refuels/export/csv` | CSV |
| GET | `/api/v1/refuels/export/xlsx` | Excel |
| POST | `/api/v1/ocr/receipt` | OCR чека (10 req/hour) |

## Правила написания кода

- Все функции: docstrings на английском (Google-style для mkdocstrings)
- Бизнес-логика: комментарии на русском
- Нет магических чисел — только именованные константы
- Расчёты ТОЛЬКО в `calculations.py` (backend) и `calculations.ts` (frontend) — не дублировать в роутерах
- Офлайн-логика ТОЛЬКО в `sync.ts` — не делать прямые API-вызовы из компонентов
- При изменении формул расчёта — обновить оба файла и оба тест-сюита

## Инфраструктура репозитория

```
Репозиторий:    PVMaksim/fuel-tracker
Сервер:         /home/deploy/fuel-tracker
CI/CD ключ:     github-actions-key → GitHub Secret SSH_PRIVATE_KEY
HTTPS:          обязателен (PWA-камера без него не работает)
```

## Инструкции для AI (совместимость с Serena MCP)

- Держать код модульным: один файл = одна ответственность
- Чёткие описательные имена функций и переменных на английском
- Документировать все публичные интерфейсы
- Перед изменением расчётов убедиться что тесты покрывают edge cases
- `create_tables()` использовать ТОЛЬКО в тестах — на проде `alembic upgrade head`
