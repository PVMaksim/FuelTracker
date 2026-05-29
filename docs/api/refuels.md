# Заправки API

## GET /refuels — Список заправок

```http
GET /api/v1/refuels?limit=50&offset=0
X-API-Key: your-api-key
```

**Параметры:**

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `limit` | int | 50 | Количество записей |
| `offset` | int | 0 | Смещение (для пагинации) |

**Ответ `200`:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2026-04-30T10:30:00Z",
    "odometer": 79240,
    "fuel_price": 58.50,
    "total_cost": 2340.00,
    "liters": 40.00,
    "distance": 540,
    "consumption": 7.41,
    "local_id": "1714470600000-abc123",
    "notes": null
  }
]
```

---

## POST /refuels — Создать заправку

```http
POST /api/v1/refuels
X-API-Key: your-api-key
Content-Type: application/json

{
  "odometer": 79240,
  "fuel_price": 58.50,
  "total_cost": 2340.00,
  "local_id": "1714470600000-abc123",
  "notes": "Лукойл",
  "created_at": "2026-04-30T10:30:00Z"
}
```

!!! info "Автоматические расчёты"
    Сервер автоматически вычисляет `liters`, `distance` и `consumption`.
    Передавать эти поля не нужно.

**Валидации:**

- `odometer` > последнего сохранённого пробега (или `INITIAL_ODOMETER`)
- `fuel_price` > 0
- `total_cost` > 0

**Ответ `201`:** объект `Refuel`

**Ошибка `422` (неверный пробег):**
```json
{"detail": "Пробег должен быть больше 78700 км (последний сохранённый)"}
```

---

## POST /refuels/bulk — Офлайн-синхронизация

```http
POST /api/v1/refuels/bulk
X-API-Key: your-api-key
Content-Type: application/json

[
  {
    "odometer": 79240,
    "fuel_price": 58.50,
    "total_cost": 2340.00,
    "local_id": "1714470600000-abc123",
    "created_at": "2026-04-30T10:30:00Z"
  }
]
```

**Ответ `200`:**
```json
[
  {
    "local_id": "1714470600000-abc123",
    "server_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "created"
  }
]
```

**Статусы ответа:**

| Статус | Описание |
|--------|----------|
| `created` | Запись создана на сервере |
| `skipped` | `local_id` уже существует (дедупликация) |
| `error` | Ошибка валидации конкретной записи |

---

## DELETE /refuels/{id} — Удалить запись

```http
DELETE /api/v1/refuels/550e8400-e29b-41d4-a716-446655440000
X-API-Key: your-api-key
```

**Ответ `204`:** пустой ответ  
**Ошибка `404`:** запись не найдена
