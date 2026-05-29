# Тестирование

**41 тест, 100% pass rate.**

## Запуск

```bash
# Все тесты
cd fuel-tracker
PYTHONPATH=backend pytest tests/ -v

# Только unit-тесты расчётов
pytest tests/test_calculations.py

# Только API интеграционные тесты
pytest tests/test_api_refuels.py

# Frontend тесты (Vitest)
cd frontend && npm test
```

## Структура тестов

| Файл | Тип | Тестов | Покрытие |
|------|-----|--------|----------|
| `tests/test_calculations.py` | Unit | 24 | `calculations.py` — все функции, граничные случаи |
| `tests/test_api_refuels.py` | Integration | 17 | Все эндпоинты `/refuels` через AsyncClient + SQLite |
| `frontend/lib/calculations.test.ts` | Unit | 15 | `calculations.ts` — зеркало Python тестов |

## Инфраструктура тестов

**Backend:** `pytest-asyncio` + `httpx AsyncClient` + `SQLite in-memory` (aiosqlite).  
Каждый тест получает изолированную БД через фикстуру `db_session`. Миграции отключены — используется `create_tables()`.

**Frontend:** `Vitest` — запускается в Node.js без браузера, мгновенный feedback.

## CI — тесты блокируют деплой

```yaml
# .github/workflows/deploy.yml
jobs:
  lint-and-test:          # ← этот job должен пройти
    steps:
      - ruff check        # Python lint
      - pytest tests/     # Python tests
      - npm run lint      # ESLint
  deploy:
    needs: lint-and-test  # ← деплой только если тесты зелёные
```

## Добавление нового теста

При добавлении нового бизнес-правила (например, максимальный объём заправки):

1. Добавить тест в `test_calculations.py` или `test_api_refuels.py`
2. Добавить зеркальный тест в `calculations.test.ts`
3. Убедиться что оба файла дают одинаковый результат
