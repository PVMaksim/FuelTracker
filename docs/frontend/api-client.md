# API клиент

HTTP-клиент для запросов к FastAPI бэкенду.

Файл: `frontend/lib/api.ts`

## Конфигурация

```typescript
// Из переменных окружения Next.js
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
```

## Методы

| Метод | Описание |
|-------|----------|
| `api.getRefuels(limit?)` | Список заправок |
| `api.createRefuel(data)` | Создать запись |
| `api.bulkSync(items)` | Офлайн-синхронизация |
| `api.deleteRefuel(id)` | Удалить запись |
| `api.getStats()` | Статистика |
| `api.analyzeReceipt(file)` | OCR фото чека |
| `api.exportCsv()` | URL для скачивания CSV |
| `api.exportXlsx()` | URL для скачивания Excel |
