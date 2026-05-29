# Офлайн-режим и синхронизация

## Алгоритм сохранения заправки

```mermaid
sequenceDiagram
    participant User as 👤 Пользователь
    participant UI as Next.js UI
    participant IDB as IndexedDB
    participant API as FastAPI

    User->>UI: Нажать «Сохранить»
    UI->>UI: Валидация (пробег > последний)
    UI->>UI: Расчёт liters, consumption
    UI->>IDB: saveRefuel({...data, isSynced: false})
    IDB-->>UI: ✅ Сохранено локально

    alt Онлайн
        UI->>API: POST /api/v1/refuels
        API-->>UI: {id: "server-uuid"}
        UI->>IDB: markSynced(localId, serverId)
    else Офлайн
        UI-->>User: 🔴 Сохранено офлайн
    end

    UI-->>User: ✅ Успех (показать расчёт)
```

## Алгоритм синхронизации при восстановлении сети

```mermaid
sequenceDiagram
    participant Browser as Браузер
    participant SP as SyncProvider
    participant IDB as IndexedDB
    participant API as FastAPI

    Browser->>SP: window: online event
    SP->>SP: setStatus("syncing")
    SP->>IDB: getUnsyncedRefuels()
    IDB-->>SP: [{localId, ...}, ...]

    SP->>API: POST /api/v1/refuels/bulk
    Note over SP,API: Массив несинхронизированных записей

    API-->>SP: [{local_id, server_id, status}]

    loop Для каждой успешной записи
        SP->>IDB: markSynced(localId, serverId)
    end

    SP->>SP: setStatus("online")
    SP-->>Browser: Индикатор исчезает
```

## Дедупликация

Каждая локальная запись имеет `localId` (генерируется на клиенте).  
При синхронизации сервер проверяет уникальность по `local_id`:

```python
# backend/src/routers/refuels.py
exists = await db.execute(
    select(Refuel.id).where(Refuel.local_id == item.local_id)
)
if exists.scalar_one_or_none():
    results.append({"local_id": item.local_id, "status": "skipped"})
    continue
```

Это гарантирует что повторная синхронизация не создаёт дублей.

## IndexedDB схема (Dexie.js)

```typescript
// frontend/lib/db.ts
interface LocalRefuel {
  localId: string;       // PK — UUID клиента
  serverId?: string;     // ID на сервере (после sync)
  isSynced: boolean;     // false = ожидает отправки

  odometer: number;
  fuelPrice: number;
  totalCost: number;
  liters: number;        // Вычислено локально
  distance?: number;     // Вычислено локально
  consumption?: number;  // Вычислено локально
  createdAt: string;     // ISO string
}
```

!!! warning "Ограничение Safari"
    IndexedDB в приватном режиме Safari работает с ограниченным объёмом.
    Предупредить пользователя об этом при первом открытии.
