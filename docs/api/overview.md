# API Reference

Базовый URL: `https://your-domain.com/api/v1`

Swagger UI (только при `DEBUG=true`): `https://your-domain.com/api/docs`

## Аутентификация

Все эндпоинты требуют заголовок:

```http
X-API-Key: your-api-key
```

## Все эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/health` | Health check (статус + БД) |
| `GET` | `/api/v1/refuels` | Список заправок |
| `POST` | `/api/v1/refuels` | Создать заправку |
| `PUT` | `/api/v1/refuels/{id}` | Редактировать запись |
| `DELETE` | `/api/v1/refuels/{id}` | Удалить запись |
| `POST` | `/api/v1/refuels/bulk` | Офлайн-синхронизация |
| `GET` | `/api/v1/stats` | Статистика + monthly_data |
| `GET` | `/api/v1/refuels/export/csv` | Скачать CSV |
| `GET` | `/api/v1/refuels/export/xlsx` | Скачать Excel |
| `POST` | `/api/v1/ocr/receipt` | OCR фото чека (10 req/hour) |

## Health check

```http
GET /api/health
```

```json
{"status": "ok", "database": "ok", "version": "1.1.0"}
```

Если PostgreSQL недоступен — возвращает `503 Service Unavailable`:

```json
{"status": "degraded", "database": "unavailable", "version": "1.1.0"}
```

## Модель `Refuel`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-04-30T10:30:00Z",
  "odometer": 79240,
  "fuel_price": 58.50,
  "total_cost": 2340.00,
  "liters": 40.00,
  "distance": 540,
  "consumption": 7.41,
  "cost_per_km": 4.33,
  "fuel_type": "95",
  "local_id": "1714470600000-abc123",
  "notes": "Лукойл на Невском"
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `odometer` | integer | Пробег в км |
| `fuel_price` | decimal | Цена за литр (₽) |
| `total_cost` | decimal | Сумма заправки (₽) |
| `liters` | decimal | `total_cost / fuel_price` |
| `distance` | integer\|null | Пробег с предыдущей заправки |
| `consumption` | decimal\|null | Расход л/100км |
| `cost_per_km` | decimal\|null | Стоимость ₽/км |
| `fuel_type` | string\|null | `92`, `95`, `98`, `diesel` |
| `local_id` | string\|null | Клиентский ID для дедупликации |

## Общие ошибки

| Код | Описание |
|-----|----------|
| `403` | Неверный API-ключ |
| `404` | Запись не найдена |
| `422` | Ошибка валидации (напр. пробег <= предыдущего) |
| `429` | Rate limit превышен (OCR: 10 req/hour) |
| `503` | База данных недоступна |
| `500` | Внутренняя ошибка → уведомление в Telegram |
