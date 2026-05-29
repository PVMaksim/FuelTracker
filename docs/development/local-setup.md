# Локальная разработка

## Требования

- Docker Desktop (Mac)
- Node.js 20+ (для `npm run dev` без Docker)
- Python 3.12+ (для бэкенда без Docker)
- Git

## Первый запуск

```bash
git clone https://github.com/PVMaksim/fuel-tracker.git
cd fuel-tracker
cp .env.example .env
```

Отредактировать `.env` — минимум для локальной работы:

```bash
POSTGRES_DB=fuel_tracker
POSTGRES_USER=fuel_user
POSTGRES_PASSWORD=localdev123
POSTGRES_HOST=db
API_KEY=localdev-key
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_API_KEY=localdev-key
DEBUG=true
INITIAL_ODOMETER=78700
```

```bash
# Запустить все сервисы
docker compose up --build

# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# Swagger:   http://localhost:8000/api/docs
```

## Разработка фронтенда без Docker

Быстрее для итераций UI — hot reload работает мгновенно:

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

Бэкенд при этом всё равно запускать через Docker:

```bash
docker compose up db backend
```

## Разработка бэкенда без Docker

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# PostgreSQL нужен — запустить только БД через Docker
docker compose up db

# Запустить бэкенд
uvicorn src.main:app --reload --port 8000
```

## Полезные команды

```bash
# Посмотреть логи конкретного сервиса
docker compose logs -f backend
docker compose logs -f frontend

# Подключиться к базе данных
docker compose exec db psql -U fuel_user fuel_tracker

# Перезапустить один сервис без пересборки
docker compose restart backend

# Пересобрать и перезапустить только бэкенд
docker compose up --build backend

# Остановить всё и удалить тома (⚠️ удалит данные БД)
docker compose down -v
```

## Структура веток

| Ветка | Назначение |
|-------|------------|
| `main` | Продакшн — каждый push автоматически деплоится |
| `develop` | Разработка — мержится в `main` когда готово |

```bash
# Начать новую фичу
git checkout -b feature/ocr-improvements

# Слить в main (триггерит деплой)
git checkout main
git merge feature/ocr-improvements
git push origin main
```
