# Синхронизация

Логика описана в [Архитектура → Офлайн и синхронизация](../architecture/offline-sync.md).

Реализация: `frontend/lib/sync.ts`

## Ключевые функции

| Функция | Описание |
|---------|----------|
| `saveRefuel(input)` | Офлайн-first сохранение (IndexedDB → сервер) |
| `syncPendingRefuels()` | Массовая синхронизация при восстановлении сети |

## SyncProvider

`components/SyncProvider.tsx` — React-контекст, подписанный на события `online`/`offline`.  
Показывает баннер статуса и запускает `syncPendingRefuels()` при появлении сети.
