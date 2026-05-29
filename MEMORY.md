# MEMORY.md — FuelTracker

## Последняя сессия: 01.05.2026

### Итоговое состояние

**Тесты:** 41/41 ✅
- `tests/test_calculations.py` — 24 unit-теста (расчёты, граничные случаи)
- `tests/test_api_refuels.py` — 17 интеграционных тестов (AsyncClient + SQLite in-memory)
- `frontend/lib/calculations.test.ts` — 15 Vitest-тестов (зеркало Python)

**Документация:** 27 страниц MkDocs Material, `mkdocs build --strict` ✅

### Всё реализовано

**Backend:**
- FastAPI + SQLAlchemy async + PostgreSQL 16
- `refuel_service.py` — service-слой с `OdometerTooLowError` и напоминанием о ТО
- `calculations.py` — `calculate_liters`, `calculate_consumption`, `calculate_distance`, `calculate_cost_per_km`
- Alembic миграции: `0001_initial`, `0002_fuel_type_cost_per_km`
- Rate limiting: slowapi (10 req/hour для OCR)
- Health check проверяет PostgreSQL (503 если БД упала)
- Алерты в Telegram при ошибках production
- CSV и XLSX экспорт (openpyxl)
- OCR чеков через Claude API

**Frontend (PWA):**
- Next.js 14 PWA, manifest.json, установка через Safari
- Страницы: `/` dashboard, `/add` форма, `/history` история, `/stats` статистика
- `SyncProvider` — автосинхронизация при восстановлении сети
- `Skeleton` компоненты на всех страницах
- `HistoryFilters` — фильтр по типу топлива (92/95/98/diesel) и периоду
- Pull-to-refresh через touch-события
- `error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx`
- Тип топлива: `fuel_type` в форме (кнопки), истории, дашборде
- Метрика `cost_per_km` (₽/км) везде

**CI/CD и инфраструктура:**
- `deploy.yml`: lint → test → build → deploy (деплой блокируется при провале)
- `docs.yml`: mkdocs → GitHub Pages
- `dependabot.yml`: авто-обновление pip/npm/actions еженедельно
- `scripts/ios_widget.js` — Scriptable виджет для iPhone
- `scripts/import_numbers.py` — импорт из Apple Numbers CSV
- `scripts/backup.sh` — PostgreSQL дамп с 7-дневной ротацией

## Следующая сессия

- [ ] Заменить `datetime.utcnow()` на `datetime.now(timezone.utc)` — убрать 11 deprecation warnings в тестах
  - Затронутые файлы: `backend/src/routers/stats.py`, `backend/src/services/refuel_service.py`, `tests/test_api_refuels.py`
- [ ] Добавить кнопку удаления в карточку истории (`history/page.tsx`) — DELETE в API есть, в UI нет
- [ ] Написать `tests/test_api_stats.py` — `GET /stats` не покрыт тестами
- [ ] Написать `tests/test_api_export.py` — CSV и XLSX не тестируются
- [ ] Создать иконки `icon-192.png`, `icon-512.png` → `frontend/public/icons/`
- [ ] Создать репозиторий `PVMaksim/fuel-tracker` и задеплоить

## Известный технический долг

| Проблема | Файл | Приоритет |
|----------|------|-----------|
| `datetime.utcnow()` — deprecated Python 3.12 | stats.py, refuel_service.py, tests | Низкий (работает, но даёт warnings) |
| `create_tables()` в lifespan — не удалён полностью | connection.py | Низкий (уже используется только в тестах) |
| TypeDoc не запускается в CI | typedoc.json | Низкий (только локально через build_docs.sh --ts) |
| Нет тестов для `/stats` и `/export` роутеров | — | Средний |
| Кнопка удаления в истории отсутствует в UI | history/page.tsx | Средний |

## Данные для первого запуска

```bash
# Начальный пробег из Numbers:
INITIAL_ODOMETER=78700

# Импорт исторических данных:
python scripts/import_numbers.py \
  --file ~/Downloads/expenses.csv \
  --api-url https://your-domain.com/api/v1 \
  --api-key YOUR_KEY \
  --dry-run
```

## Архивы проекта

- `fuel-tracker-v3.tar.gz` — финальный архив (142 файла)
