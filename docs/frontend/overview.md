# Frontend — обзор

Next.js 14 PWA с офлайн-поддержкой через IndexedDB.

## Страницы

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/` | `app/page.tsx` | Дашборд: пробег, ср. расход, последняя заправка |
| `/add` | `app/add/page.tsx` | Форма добавления + OCR камера |
| `/history` | `app/history/page.tsx` | Список всех заправок |
| `/stats` | `app/stats/page.tsx` | График расхода + статистика |

## Библиотеки

| Библиотека | Назначение |
|------------|------------|
| `Dexie.js` | IndexedDB (офлайн-хранилище) |
| `next-pwa` | Service Worker + кэширование |
| `Recharts` | График расхода (л/100км по времени) |
| `lucide-react` | Иконки |
| `Tailwind CSS` | Стилизация |

## PWA установка на iPhone

!!! warning "Только Safari"
    Кнопка «На экран Домой» доступна только в Safari.
    Chrome и другие браузеры на iOS не поддерживают установку PWA.

1. Safari → `https://your-domain.com`
2. Кнопка **Поделиться** (↑)
3. **«На экран «Домой»»**
4. **«Добавить»**

## Структура `lib/`

```
lib/
├── db.ts           # Dexie схема + CRUD для IndexedDB
├── api.ts          # HTTP-клиент (fetch + X-API-Key)
├── sync.ts         # Офлайн-first логика сохранения
└── calculations.ts # Формулы расхода (зеркало backend)
```
