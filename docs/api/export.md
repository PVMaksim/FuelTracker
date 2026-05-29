# Экспорт данных

## GET /refuels/export/csv

Скачать все заправки в CSV-формате (UTF-8 with BOM для корректного открытия в Excel на Windows).

```http
GET /api/v1/refuels/export/csv
X-API-Key: your-api-key
```

**Ответ:** файл `fueltracker_YYYYMMDD.csv`

**Формат CSV:**
```
Дата,Пробег (км),Пробег за интервал (км),Цена за литр (₽),Сумма (₽),Литры,Расход (л/100км),Заметки
30.04.2026 10:30,79240,540,58.50,2340.00,40.00,7.41,Лукойл
```

---

## GET /refuels/export/xlsx

Скачать все заправки в Excel-формате с форматированием.

```http
GET /api/v1/refuels/export/xlsx
X-API-Key: your-api-key
```

**Ответ:** файл `fueltracker_YYYYMMDD.xlsx`

!!! tip "Открытие в Numbers на Mac"
    Файл `.xlsx` открывается в Apple Numbers через двойной клик.
    Заголовки выделены оранжевым цветом.
