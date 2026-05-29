# Статистика API

## GET /stats

```http
GET /api/v1/stats
X-API-Key: your-api-key
```

**Ответ `200`:**
```json
{
  "total_refuels": 42,
  "total_cost": 98400.00,
  "total_liters": 1680.00,
  "avg_consumption": 7.84,
  "avg_consumption_30d": 7.52,
  "last_odometer": 99340,
  "last_fuel_price": 61.20,
  "chart_data": [
    {"date": "15.01.2026", "consumption": 8.12, "odometer": 82000},
    {"date": "01.02.2026", "consumption": 7.65, "odometer": 84500}
  ]
}
```

### Описание полей

| Поле | Описание |
|------|----------|
| `avg_consumption` | Средний расход за всё время (л/100км) |
| `avg_consumption_30d` | Средний расход за последние 30 дней |
| `last_odometer` | Последний пробег (подсказка в форме) |
| `last_fuel_price` | Последняя цена за литр (подсказка в форме) |
| `chart_data` | Данные для графика (последние 30 записей с `consumption`) |
