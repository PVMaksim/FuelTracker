PWA-приложение для трекинга расходов на топливо. Устанавливается на iPhone через Safari без App Store, работает офлайн, синхронизируется с сервером при появлении сети, распознаёт чеки АЗС по фото.

**Автомобиль:** Toyota Fielder · **Начальный пробег:** 78 700 км

**Продакшн:** https://neoxis.store:9443

## Быстрый старт (локально)

```bash
git clone https://github.com/PVMaksim/fuel-tracker.git
cd fuel-tracker

cp .env.example .env
# Заполни .env своими значениями

docker compose up --build

# Frontend:  http://localhost:3000
# Swagger:   http://localhost:8000/api/docs  (только при DEBUG=true)

Деплой на VPS (Beget)
Первый раз
# Подключиться к серверу
ssh deploy@193.242.109.48

# Клонировать репозиторий
cd /home/deploy
git clone https://github.com/PVMaksim/fuel-tracker.git FuelTracker
cd FuelTracker

# Создать .env
cp .env.example .env
nano .env  # заполнить POSTGRES_*, API_KEY, NEXT_PUBLIC_*

# Запустить
docker compose up -d --build

Последующие деплои (автоматически)

# При git push origin main — GitHub Actions сам задеплоит
# Вручную:
ssh ft "cd /home/deploy/FuelTracker && git pull origin main && docker compose up -d --build"

SSH-алиас на Mac

# ~/.ssh/config
Host ft
    HostName 193.242.109.48
    User deploy
    IdentityFile ~/.ssh/fueltracker_deploy
    IdentitiesOnly yes


Установка PWA на iPhone

Только через Safari — Chrome на iOS не поддерживает установку PWA
Safari → https://neoxis.store:9443
Кнопка Поделиться (↑)
«На экран "Домой"»
«Добавить»
Переменные окружения

Все переменные с описанием — в .env.example.

Переменная	Обязательная	Описание		
POSTGRES_*	✅	Параметры PostgreSQL		
API_KEY	✅	Статический ключ для `X-API-Key`		
NEXT_PUBLIC_API_URL	✅	URL API (`https://neoxis.store:9443/api`)		
NEXT_PUBLIC_API_KEY	✅	Тот же `API_KEY`		
ANTHROPIC_API_KEY	Для OCR	Ключ Claude API		
TELEGRAM_BOT_TOKEN	Для алертов	Токен бота для уведомлений		
ADMIN_TELEGRAM_ID	Для алертов	Твой Telegram ID		
SERVICE_INTERVAL_KM	—	Порог ТО в км (по умолчанию 10000)		

Важно: NEXT_PUBLIC_API_URL должен быть без /v1! Правильно: https://neoxis.store:9443/api
Структура проекта

fuel-tracker/
── backend/               # FastAPI + Python 3.12
│   ├── src/
│   │   ├── routers/       # HTTP-слой (тонкий)
│   │   ├── services/      # Бизнес-логика (расчёты, OCR, уведомления)
│   │   └── database/      # Модели + Alembic миграции
│   └── alembic.ini
── frontend/              # Next.js 14 PWA + TypeScript
│   ├── app/               # Страницы (/, /add, /history, /stats)
│   ├── components/        # UI компоненты
│   └── lib/               # Утилиты (db, api, sync, calculations)
── docker/                # Dockerfile'ы и nginx.conf
│   ├── backend/Dockerfile
│   ├── frontend/Dockerfile
│   └── nginx.conf
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

Тестирование

# Backend (Python)
PYTHONPATH=backend pytest tests/ -v

# Frontend (TypeScript)
cd frontend && npm test

# Документация
./scripts/build_docs.sh        # live reload на localhost:8001
./scripts/build_docs.sh --build  # собрать в ./site/

Импорт данных из Numbers

# 1. В Numbers: Файл → Экспортировать → CSV
# 2. Проверочный запуск:
python scripts/import_numbers.py \
  --file ~/Downloads/expenses.csv \
  --api-url https://neoxis.store:9443/api/v1 \
  --api-key YOUR_KEY \
  --dry-run

# 3. Убрать --dry-run для реального импорта

GitHub Secrets для CI/CD

SSH_PRIVATE_KEY
Содержимое ~/.ssh/github-actions-key
VPS_HOST
193.242.109.48
NEXT_PUBLIC_API_URL
https://neoxis.store:9443/api
NEXT_PUBLIC_API_KEY
Значение API_KEY из .env
TELEGRAM_BOT_TOKEN
Токен бота
ADMIN_TELEGRAM_ID
Твой Telegram ID

Документация

https://pvmaksim.github.io/fuel-tracker/
Инфраструктура
Хостинг: Beget Cloud VPS (Латвия)
IP: 193.242.109.48
Домен: neoxis.store
HTTPS: порт 9443 (Let's Encrypt)
HTTP: порт 8090 (редирект на HTTPS)
UFW: разрешены 22, 80, 443, 9443, 8443



---

## 📝 Команды для коммита

```bash
cd '/Users/macmax/Documents/Разработка IT/FuelTracker'

# Обновить файлы
git add CLAUDE.md MEMORY.md README.md
git commit -m "docs: зафиксировать деплой на Beget VPS (neoxis.store:9443)

- Обновить CLAUDE.md: добавить инфраструктуру, API URL, нюансы деплоя
- Обновить MEMORY.md: сессия 16.06.2026 (деплой, исправления)
- Обновить README.md: актуальные URL, инструкции по деплою на Beget"

git push origin main



        
