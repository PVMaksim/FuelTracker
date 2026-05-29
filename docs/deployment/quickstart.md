# Быстрый старт

## Локальный запуск (без HTTPS)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/PVMaksim/fuel-tracker.git
cd fuel-tracker

# 2. Настроить переменные окружения
cp .env.example .env
# Отредактировать .env: минимально нужны POSTGRES_* и API_KEY

# 3. Запустить
docker compose up --build

# 4. Открыть
# Frontend: http://localhost:3000
# API docs: http://localhost:8000/api/docs (если DEBUG=true)
```

!!! warning "OCR не работает локально без HTTPS"
    Доступ к камере в браузере требует HTTPS.  
    Для тестирования OCR — только на VPS с SSL.

## Минимальный .env для локального запуска

```bash
POSTGRES_DB=fuel_tracker
POSTGRES_USER=fuel_user
POSTGRES_PASSWORD=localdev123
POSTGRES_HOST=db

API_KEY=localdev-key-change-in-prod

NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_API_KEY=localdev-key-change-in-prod

DEBUG=true
INITIAL_ODOMETER=78700
CAR_NAME=Fielder
```

## Проверка работоспособности

```bash
# Health check
curl http://localhost:8000/api/health

# Создать тестовую запись
curl -X POST http://localhost:8000/api/v1/refuels \
  -H "X-API-Key: localdev-key-change-in-prod" \
  -H "Content-Type: application/json" \
  -d '{"odometer": 79240, "fuel_price": 58.50, "total_cost": 2340}'

# Посмотреть список
curl http://localhost:8000/api/v1/refuels \
  -H "X-API-Key: localdev-key-change-in-prod"
```
