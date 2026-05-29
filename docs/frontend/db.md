# Офлайн БД — Dexie.js

IndexedDB-хранилище для работы без интернета.

## Схема

```typescript
interface LocalRefuel {
  localId: string;      // PK — генерируется клиентом
  serverId?: string;    // Присваивается после синхронизации
  isSynced: boolean;    // false = ожидает отправки на сервер
  createdAt: string;    // ISO datetime

  odometer: number;
  fuelPrice: number;
  totalCost: number;
  liters: number;       // Вычисляется локально
  distance?: number;
  consumption?: number;
}
```

## API функции

| Функция | Описание |
|---------|----------|
| `getAllRefuels()` | Все записи, новые первые |
| `getLastOdometer()` | Последний пробег (для валидации) |
| `getLastFuelPrice()` | Последняя цена (для подсказки в форме) |
| `saveRefuelLocally()` | Сохранить запись |
| `markSynced()` | Пометить как синхронизированную |
| `getUnsyncedRefuels()` | Записи ожидающие синхронизации |
| `deleteLocalRefuel()` | Удалить запись |

## Исходный код

Файл: `frontend/lib/db.ts`
