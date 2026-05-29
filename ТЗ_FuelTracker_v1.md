# Техническое задание: FuelTracker PWA

| Поле | Значение |
|------|----------|
| **Название** | FuelTracker |
| **Репозиторий** | `PVMaksim/fuel-tracker` |
| **Версия документа** | 1.0 |
| **Дата** | 30.04.2026 |
| **Статус** | Утверждён |

---

## 1. Цель проекта

Замена ручного учёта заправок в Apple Numbers на PWA-приложение, которое устанавливается на iPhone как иконка и работает без App Store. Приложение фиксирует каждую заправку, автоматически считает расход на 100 км, распознаёт чеки по фото, работает офлайн и хранит полную историю с графиками.

---

## 2. Контекст

Текущее состояние — файл Numbers с общей таблицей расходов, где топливо смешано с едой и ремонтом. Пробег записывается вручную текстом (`Пробег 78700`). Нет статистики, нет автоматических расчётов.

Автомобиль: **Toyota Fielder**, начальный пробег из таблицы: **78 700 км**.

---

## 3. Принятые архитектурные решения

| Решение | Выбор | Обоснование |
|---------|-------|-------------|
| Интерфейс | PWA (Next.js) | Иконка на iPhone, без App Store, доступ к камере |
| Backend | FastAPI (Python 3.12) | Единообразие с другими проектами, быстрый REST |
| БД на сервере | PostgreSQL 16 | Надёжность, возможность сложных запросов для статистики |
| Офлайн-хранилище | IndexedDB (Dexie.js) | Работа без сети, синхронизация при появлении интернета |
| OCR чеков | Claude API (vision) | Высокая точность для русских чеков, уже знаком |
| Инфраструктура | Docker + GitHub Actions + VPS | Стандарт по SKILL_IT_PROJECTS_RU |

---

## 4. Функциональные требования

### 4.1 Запись заправки (основной флоу)

| ID | Требование | Приоритет |
|----|------------|-----------|
| FR-1 | Ввод текущего пробега. Валидация: целое число > последнего сохранённого | Must |
| FR-2 | Ввод цены за литр. Валидация: число > 0, до 2 знаков после запятой | Must |
| FR-3 | Ввод суммы заправки. Валидация: число > 0 | Must |
| FR-4 | Автоматический расчёт: `литры = сумма / цена` | Must |
| FR-5 | Автоматический расчёт: `расход = литры / (пробег - предыдущий_пробег) × 100` | Must |
| FR-6 | Сохранение записи с датой и временем | Must |
| FR-7 | Подтверждение: показать литры, пробег за интервал, расход л/100км | Must |
| FR-8 | OCR: фото чека → автозаполнение суммы и литров | Should |
| FR-9 | Ручная корректировка полей после OCR | Should |

### 4.2 История и статистика

| ID | Требование | Приоритет |
|----|------------|-----------|
| FR-10 | Список заправок (дата, пробег, литры, сумма, расход) | Must |
| FR-11 | Средний расход за всё время и за последние 30 дней | Must |
| FR-12 | График расхода (л/100км) по времени | Should |
| FR-13 | Общая потраченная сумма за период | Should |

### 4.3 Данные и экспорт

| ID | Требование | Приоритет |
|----|------------|-----------|
| FR-14 | Импорт CSV из Numbers (одноразовый, при первом запуске) | Should |
| FR-15 | Экспорт всей истории в CSV | Should |
| FR-16 | Экспорт в Excel (.xlsx) | Could |

### 4.4 Офлайн

| ID | Требование | Приоритет |
|----|------------|-----------|
| FR-17 | Запись заправки без интернета (сохраняется в IndexedDB) | Must |
| FR-18 | Просмотр истории без интернета | Must |
| FR-19 | Синхронизация с сервером при появлении сети | Must |
| FR-20 | Индикатор статуса: онлайн / офлайн / синхронизация | Should |

---

## 5. Сценарии использования

### Сценарий A — Ввод вручную

```
Открыть приложение (иконка на рабочем столе iPhone)
  ↓
Нажать «+ Заправка»
  ↓
Поле «Текущий пробег»: подсказка — последний сохранённый (78 700 км)
Ввести: 79 240
  → Ошибка если < 78700: «Пробег должен быть больше 78 700»
  ↓
Поле «Цена за литр»: подсказка — последняя цена
Ввести: 58.50
  ↓
Поле «Сумма заправки»:
Ввести: 2340
  ↓
Приложение считает автоматически:
  Заправлено: 40.0 л
  Пробег за интервал: 540 км
  Расход: 7.41 л/100 км
  ↓
Кнопка «Сохранить» → запись создана
```

### Сценарий B — OCR чека

```
Нажать «+ Заправка»
  ↓
Нажать иконку камеры
Сфотографировать чек АЗС
  ↓
Claude API анализирует фото:
  → Сумма: 2 340 ₽
  → Литры: 40.00 л
  → Цена: 58.50 ₽/л
  ↓
Поля заполнены автоматически
Пользователь вводит только пробег
  ↓
Сохранить
```

### Сценарий C — Офлайн

```
Открыть приложение без интернета
  ↓
Индикатор: 🔴 Офлайн
  ↓
Ввести заправку → сохраняется в IndexedDB
  ↓
Появился интернет
Индикатор: 🔄 Синхронизация...
  ↓
Данные отправлены на сервер
Индикатор: 🟢 Онлайн
```

---

## 6. Модель данных

### Таблица `refuels`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Primary key |
| `created_at` | TIMESTAMPTZ | Дата и время заправки (UTC) |
| `odometer` | INTEGER | Пробег в км |
| `fuel_price` | NUMERIC(8,2) | Цена за литр (₽) |
| `total_cost` | NUMERIC(10,2) | Сумма заправки (₽) |
| `liters` | NUMERIC(6,2) | Литров (вычислено: total_cost / fuel_price) |
| `distance` | INTEGER | Пробег с предыдущей заправки (вычислено) |
| `consumption` | NUMERIC(5,2) | Расход л/100км (вычислено) |
| `is_synced` | BOOLEAN | Синхронизировано с сервером |
| `local_id` | TEXT | ID из IndexedDB для дедупликации при синхронизации |
| `receipt_ocr_raw` | TEXT | Сырой ответ OCR (для отладки) |
| `notes` | TEXT | Заметка пользователя (необязательно) |

**Индексы:** `created_at DESC`, `odometer`

---

## 7. API Design (FastAPI)

### Базовый URL: `/api/v1`

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/refuels` | Список заправок (пагинация, фильтр по дате) |
| `POST` | `/refuels` | Создать заправку |
| `POST` | `/refuels/bulk` | Импорт массива (для офлайн-синхронизации) |
| `PUT` | `/refuels/{id}` | Редактировать запись |
| `DELETE` | `/refuels/{id}` | Удалить запись |
| `GET` | `/stats` | Средний расход, суммы за период |
| `GET` | `/refuels/export/csv` | Выгрузка в CSV |
| `GET` | `/refuels/export/xlsx` | Выгрузка в Excel |
| `POST` | `/import/csv` | Импорт из Numbers CSV |
| `POST` | `/ocr/receipt` | Анализ фото чека → {cost, liters, price} |
| `GET` | `/health` | Проверка состояния сервиса |

**Аутентификация:** статический API-ключ в заголовке `X-API-Key` (только один пользователь — разработчик).

---

## 8. Технологический стек

| Категория | Технология | Версия | Обоснование |
|-----------|------------|--------|-------------|
| Frontend | Next.js (App Router) | 14 | PWA-поддержка, SSR, TypeScript |
| UI компоненты | shadcn/ui + Tailwind CSS | latest | Быстрая разработка |
| Офлайн БД | Dexie.js (IndexedDB) | 3 | Лучший API для IndexedDB |
| Service Worker | next-pwa | latest | Кэширование, офлайн-режим |
| Графики | Recharts | latest | React-нативные графики |
| Backend | FastAPI | 0.111 | Быстрый, автодокументация |
| ORM | SQLAlchemy 2 + asyncpg | latest | Async, Pydantic-совместимость |
| Миграции | Alembic | latest | Версионирование схемы БД |
| БД | PostgreSQL | 16-alpine | Надёжность, JSON поддержка |
| OCR | Anthropic Claude API | claude-sonnet-4 | Точность, русский язык |
| Контейнеры | Docker + Compose | latest | Стандарт проекта |
| CI/CD | GitHub Actions | — | Стандарт проекта |
| Обратный прокси | Nginx + Certbot | alpine | HTTPS (обязателен для PWA!) |
| Ошибки | Telegram-уведомление | — | Стандарт проекта |

> ⚠️ **Важно:** PWA с доступом к камере работает **только по HTTPS**. Nginx + Certbot (Let's Encrypt) — обязательны.

---

## 9. Структура проекта

```
fuel-tracker/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── docker/
│   ├── frontend/
│   │   └── Dockerfile          # Next.js production build
│   ├── backend/
│   │   └── Dockerfile          # FastAPI + uvicorn
│   └── nginx.conf              # Reverse proxy + SSL
├── frontend/                   # Next.js приложение
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Главная: последняя статистика + кнопка +
│   │   ├── history/
│   │   │   └── page.tsx        # История заправок
│   │   ├── stats/
│   │   │   └── page.tsx        # График и статистика
│   │   └── add/
│   │       └── page.tsx        # Форма добавления заправки
│   ├── components/
│   │   ├── RefuelForm.tsx      # Форма ввода
│   │   ├── ReceiptCamera.tsx   # Камера + отправка на OCR
│   │   ├── ConsumptionChart.tsx # График Recharts
│   │   ├── HistoryList.tsx
│   │   └── SyncIndicator.tsx   # Онлайн/офлайн статус
│   ├── lib/
│   │   ├── db.ts               # Dexie.js (IndexedDB)
│   │   ├── api.ts              # HTTP-клиент к FastAPI
│   │   ├── sync.ts             # Логика синхронизации
│   │   └── calculations.ts     # Расчёт расхода
│   ├── public/
│   │   ├── manifest.json       # PWA манифест (иконка, название)
│   │   └── icons/              # Иконки 192×192, 512×512
│   └── next.config.js          # PWA конфигурация
├── backend/                    # FastAPI приложение
│   ├── src/
│   │   ├── main.py
│   │   ├── config.py           # Pydantic Settings
│   │   ├── database/
│   │   │   ├── models.py       # SQLAlchemy модели
│   │   │   ├── connection.py   # Async engine
│   │   │   └── migrations/     # Alembic
│   │   ├── routers/
│   │   │   ├── refuels.py
│   │   │   ├── stats.py
│   │   │   ├── export.py
│   │   │   └── ocr.py
│   │   └── services/
│   │       ├── calculations.py # Расчёт расхода
│   │       ├── ocr_service.py  # Клиент Claude API
│   │       ├── export_service.py # CSV/Excel генерация
│   │       └── notifications.py # Telegram alerts
├── scripts/
│   ├── backup.sh               # Дамп PostgreSQL → локально/облако
│   ├── init_ssl.sh             # Первичный выпуск сертификата
│   ├── health_check.sh
│   └── import_numbers.py       # Импорт CSV из Numbers
├── .env.example
├── docker-compose.yml
├── CLAUDE.md
├── MEMORY.md
└── README.md
```

---

## 10. Конфигурация (.env.example)

```bash
# Backend
API_KEY=                        # Статический ключ доступа к API
POSTGRES_DB=fuel_tracker
POSTGRES_USER=fuel_user
POSTGRES_PASSWORD=
POSTGRES_HOST=db
POSTGRES_PORT=5432

# OCR
ANTHROPIC_API_KEY=              # Для распознавания чеков

# Уведомления (стандарт проекта)
ADMIN_TELEGRAM_ID=
TELEGRAM_BOT_TOKEN=             # Отдельный бот только для алертов

# Frontend
NEXT_PUBLIC_API_URL=https://your-domain.com/api/v1
NEXT_PUBLIC_API_KEY=            # Тот же API_KEY (публичный клиент)

# Домен
DOMAIN=your-domain.com
CERTBOT_EMAIL=your@email.com

# Начальные данные
INITIAL_ODOMETER=78700          # Последний пробег из Numbers
```

---

## 11. PWA-манифест (manifest.json)

```json
{
  "name": "FuelTracker",
  "short_name": "Fuel",
  "description": "Трекер расходов на топливо",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#f97316",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

## 12. Логика офлайн-синхронизации

```
При сохранении заправки:
  1. Записать в IndexedDB (is_synced: false)
  2. Если онлайн → отправить POST /api/v1/refuels → пометить is_synced: true
  3. Если офлайн → оставить is_synced: false

При восстановлении соединения (online event):
  1. Получить из IndexedDB все записи где is_synced = false
  2. Отправить POST /api/v1/refuels/bulk [{local_id, ...данные}]
  3. Сервер отвечает [{local_id, server_id}]
  4. Обновить IndexedDB: is_synced = true, server_id = server_id

Дедупликация на сервере:
  - Уникальный индекс на (local_id) предотвращает дубли при повторной отправке
```

---

## 13. OCR — промпт для Claude API

```python
OCR_PROMPT = """
Ты анализируешь чек с автозаправочной станции.
Найди и верни ТОЛЬКО JSON без пояснений:

{
  "total_cost": <число — итоговая сумма в рублях>,
  "liters": <число — количество литров>,
  "price_per_liter": <число — цена за литр в рублях>,
  "station": "<название АЗС если видно, иначе null>"
}

Если значение не найдено — поставь null.
Числа только цифры, без пробелов и символов валюты.
"""
```

---

## 14. CI/CD (deploy.yml — структура)

```yaml
# При push в main:
# 1. Build frontend (Next.js) → Docker image → push to registry
# 2. Build backend (FastAPI) → Docker image → push to registry
# 3. SSH на VPS → docker-compose pull → docker-compose up -d
# 4. Telegram-уведомление об успешном деплое

on:
  push:
    branches: [main]

jobs:
  deploy:
    # SSH key: secrets.SSH_PRIVATE_KEY (github-actions-key)
    # VPS path: /home/deploy/fuel-tracker
```

---

## 15. План реализации

### Этап 1 — Фундамент (дней: 3–5)
- [ ] Создать репозиторий `PVMaksim/fuel-tracker`
- [ ] Настроить Docker Compose (frontend + backend + db + nginx)
- [ ] Создать CLAUDE.md, MEMORY.md, .env.example
- [ ] Настроить CI/CD (GitHub Actions → VPS)
- [ ] Выпустить SSL сертификат (scripts/init_ssl.sh)
- [ ] Проверить: HTTPS-доступ к домену

### Этап 2 — Backend MVP (дней: 4–5)
- [ ] Модели SQLAlchemy + Alembic миграция
- [ ] CRUD эндпоинты `/refuels`
- [ ] Расчёт расхода в `calculations.py`
- [ ] Эндпоинт `/stats`
- [ ] Аутентификация через API-ключ
- [ ] Telegram-уведомления об ошибках
- [ ] Тесты: pytest для расчётов

### Этап 3 — Frontend MVP (дней: 5–7)
- [ ] Next.js + shadcn/ui + PWA конфигурация
- [ ] manifest.json + иконки → установка на iPhone
- [ ] Страница добавления заправки (форма + валидация)
- [ ] Страница истории
- [ ] Dexie.js (IndexedDB) + логика синхронизации
- [ ] Индикатор онлайн/офлайн
- [ ] Service Worker (next-pwa)

### Этап 4 — Расширенные функции (дней: 4–5)
- [ ] OCR: ReceiptCamera компонент + `/ocr/receipt` эндпоинт
- [ ] График расхода (Recharts)
- [ ] Экспорт CSV и Excel
- [ ] scripts/import_numbers.py

### Этап 5 — Полировка (дней: 2–3)
- [ ] scripts/backup.sh (PostgreSQL дамп)
- [ ] Финальное тестирование офлайн-режима
- [ ] Обновить README с инструкцией установки PWA на iPhone

---

## 16. Инструкция пользователю: установка PWA на iPhone

```
1. Открыть Safari (только Safari, не Chrome!)
2. Перейти на https://your-domain.com
3. Нажать кнопку «Поделиться» (квадрат со стрелкой вверх)
4. Выбрать «На экран «Домой»»
5. Нажать «Добавить»
→ Иконка FuelTracker появится на рабочем столе
```

---

## 17. Риски

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| PWA-камера не работает без HTTPS | Высокая | Certbot на первом этапе, до разработки UI |
| Конфликты при синхронизации офлайн-записей | Средняя | local_id как UUID, уникальный индекс на сервере |
| OCR не распознал чек | Средняя | Все поля редактируемы после OCR, OCR — вспомогательный |
| Safari ограничивает IndexedDB в приватном режиме | Низкая | Документировать, предупреждать пользователя |
| Numbers CSV имеет нестандартный формат | Средняя | Предпросмотр + ручное маппирование колонок в import_numbers.py |

---

## Приложение A: ADR-001 — PWA вместо нативного iOS

**Статус:** Принято

**Контекст:** Нужно мобильное приложение для iPhone. Варианты: нативный Swift, React Native, PWA, Telegram-бот.

**Решение:** PWA (Next.js)

**Плюсы:** Не нужен App Store, нет $99/год, один кодовой базой покрывается и веб и мобайл, доступ к камере через WebAPI, знакомый стек (React/TypeScript).

**Минусы:** Работает только через Safari для установки на iOS, нет Push-уведомлений на iOS (ограничение Apple), требует HTTPS.

**Альтернативы отклонены:**
- Swift — слишком сложный стек для одного разработчика с небольшим опытом
- Telegram Mini App — зависимость от Telegram, сложнее офлайн-режим
- Telegram Bot — нет нативного UI камеры для OCR

---

## Приложение B: CLAUDE.md (шаблон для проекта)

```markdown
# CLAUDE.md — FuelTracker

## Стек
- Frontend: Next.js 14 (App Router) + TypeScript + shadcn/ui + Tailwind
- Офлайн: Dexie.js (IndexedDB) + next-pwa (Service Worker)
- Backend: FastAPI (Python 3.12) + SQLAlchemy 2 (async) + Alembic
- БД: PostgreSQL 16
- OCR: Anthropic Claude API (claude-sonnet-4, vision)
- Инфраструктура: Docker, GitHub Actions, VPS Ubuntu 22.04, Nginx + Certbot

## Архитектура
PWA-приложение. Frontend на Next.js работает офлайн через IndexedDB,
синхронизируется с FastAPI-бэкендом при появлении сети.
Один пользователь, один автомобиль (Fielder, начальный пробег 78700).

## Правила кода
- Все функции: docstrings на английском
- Бизнес-логика: комментарии на русском
- Нет магических чисел: только именованные константы
- Расчёты только в calculations.py (backend) и calculations.ts (frontend)
- Валидация пробега: всегда > последнего сохранённого

## Ключевые константы
INITIAL_ODOMETER = 78700  # из Numbers-файла
CAR_NAME = "Fielder"
```
