# Модели базы данных

## Схема таблицы `refuels`

```mermaid
erDiagram
    REFUELS {
        string id PK "UUID"
        datetime created_at "Дата заправки (UTC)"
        integer odometer "Пробег в км"
        decimal fuel_price "Цена за литр"
        decimal total_cost "Сумма заправки"
        decimal liters "Литров (вычислено)"
        integer distance "Пробег с пред. заправки"
        decimal consumption "Расход л/100км"
        decimal cost_per_km "Стоимость ₽/км"
        string fuel_type "Тип: 92/95/98/diesel"
        boolean is_synced "Синхронизировано"
        string local_id UK "ID клиента (уникальный)"
        string receipt_ocr_raw "Сырой ответ OCR"
        string notes "Заметка"
    }
```

## Миграции (Alembic)

| Версия | Описание |
|--------|----------|
| `0001_initial` | Создание таблицы `refuels` с базовыми полями |
| `0002_fuel_type_cost_per_km` | Добавление `fuel_type` и `cost_per_km` |

```bash
# Применить все миграции
cd backend && alembic upgrade head

# Откатить последнюю
alembic downgrade -1

# Статус
alembic current
alembic history
```

## Автогенерация референса

::: src.database.models
    options:
      show_root_heading: true
      show_source: true
