# ⛽ FuelTracker

PWA-приложение для трекинга расходов на топливо. Устанавливается на iPhone через Safari без App Store, работает офлайн, синхронизируется с сервером при появлении сети, распознаёт чеки АЗС по фото.

**Автомобиль:** Toyota Fielder · Начальный пробег: 78 700 км

---

## Быстрый старт (локально)

```bash
git clone https://github.com/PVMaksim/fuel-tracker.git
cd fuel-tracker

cp .env.example .env
# Заполни .env — минимум: POSTGRES_*, API_KEY, NEXT_PUBLIC_*

docker compose up --build

# Frontend:  http://localhost:3000
# Swagger:   http://localhost:8000/api/docs  (только при DEBUG=true)
```

## Деплой на VPS

```bash
# Первый раз — выпустить SSL и запустить
ssh deploy@YOUR_VPS_IP
cd /home/deploy/fuel-tracker
git clone https://github.com/PVMaksim/fuel-tracker.git .
cp .env.example .env && nano .env
chmod +x scripts/init_ssl.sh && ./scripts/init_ssl.sh
docker compose up -d

# Последующие деплои — автоматически при git push origin main
# Вручную:
ssh deploy@YOUR_VPS_IP "cd /home/deploy/fuel-tracker && docker compose pull && docker compose up -d"
```

## Установка PWA на iPhone

> Только через Safari — Chrome на iOS не поддерживает установку PWA

1. Safari → `https://your-domain.com`
2. Кнопка **Поделиться** (↑)
3. **«На экран "Домой"»**
4. **«Добавить»**

## Переменные окружения

Все переменные с описанием — в `.env.example`.

| Переменная | Обязательная | Описание |
|------------|-------------|----------|
| `POSTGRES_*` | ✅ | Параметры PostgreSQL |
| `API_KEY` | ✅ | Статический ключ для `X-API-Key` |
| `NEXT_PUBLIC_API_URL` | ✅ | URL API (`https://your-domain.com/api/v1`) |
| `NEXT_PUBLIC_API_KEY` | ✅ | Тот же `API_KEY` |
| `ANTHROPIC_API_KEY` | Для OCR | Ключ Claude API |
| `TELEGRAM_BOT_TOKEN` | Для алертов | Токен бота для уведомлений |
| `ADMIN_TELEGRAM_ID` | Для алертов | Твой Telegram ID |
| `DOMAIN` | На VPS | Доменное имя |
| `SERVICE_INTERVAL_KM` | — | Порог ТО в км (по умолчанию 10000) |

## Структура проекта

```
fuel-tracker/
├── backend/               # FastAPI + Python 3.12
│   ├── src/
│   │   ├── routers/       # HTTP-слой (тонкий)
│   │   ├── services/      # Бизнес-логика (расчёты, OCR, уведомления)
│   │   └── database/      # Модели + Alembic миграции
│   └── alembic.ini
├── frontend/              # Next.js 14 PWA + TypeScript
│   ├── app/               # Страницы (/, /add, /history, /stats)
│   ├── components/        # UI компоненты
│   └── lib/               # Утилиты (db, api, sync, calculations)
├── tests/                 # pytest (41 тест)
├── docs/                  # MkDocs Material (27 страниц)
├── scripts/               # Ops-утилиты
│   ├── init_ssl.sh        # Выпуск Let's Encrypt сертификата
│   ├── backup.sh          # Дамп PostgreSQL (cron)
│   ├── import_numbers.py  # Импорт из Apple Numbers CSV
│   └── ios_widget.js      # Scriptable виджет для iPhone
└── .github/
    ├── workflows/
    │   ├── deploy.yml     # lint → test → build → deploy
    │   └── docs.yml       # mkdocs → GitHub Pages
    └── dependabot.yml
```

## Тестирование

```bash
# Backend (Python)
PYTHONPATH=backend pytest tests/ -v

# Frontend (TypeScript)
cd frontend && npm test

# Документация
./scripts/build_docs.sh        # live reload на localhost:8001
./scripts/build_docs.sh --build  # собрать в ./site/
```

## Импорт данных из Numbers

```bash
# 1. В Numbers: Файл → Экспортировать → CSV
# 2. Проверочный запуск:
python scripts/import_numbers.py \
  --file ~/Downloads/expenses.csv \
  --api-url https://your-domain.com/api/v1 \
  --api-key YOUR_KEY \
  --dry-run
# 3. Убрать --dry-run для реального импорта
```

## GitHub Secrets для CI/CD

| Secret | Значение |
|--------|----------|
| `SSH_PRIVATE_KEY` | Содержимое `~/.ssh/github-actions-key` |
| `VPS_HOST` | IP-адрес сервера |
| `NEXT_PUBLIC_API_URL` | `https://your-domain.com/api/v1` |
| `NEXT_PUBLIC_API_KEY` | Значение `API_KEY` из `.env` |
| `TELEGRAM_BOT_TOKEN` | Токен бота |
| `ADMIN_TELEGRAM_ID` | Твой Telegram ID |

## Документация

[https://pvmaksim.github.io/fuel-tracker/](https://pvmaksim.github.io/fuel-tracker/)
