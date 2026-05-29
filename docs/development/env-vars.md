# Переменные окружения

Полный справочник всех переменных из `.env.example`.

## База данных

| Переменная | Обязательная | По умолчанию | Описание |
|------------|-------------|--------------|----------|
| `POSTGRES_DB` | ✅ | — | Имя базы данных |
| `POSTGRES_USER` | ✅ | — | Пользователь PostgreSQL |
| `POSTGRES_PASSWORD` | ✅ | — | Пароль (генерировать случайный) |
| `POSTGRES_HOST` | — | `db` | Хост БД (имя контейнера в Docker) |
| `POSTGRES_PORT` | — | `5432` | Порт PostgreSQL |

## Безопасность

| Переменная | Обязательная | Описание |
|------------|-------------|----------|
| `API_KEY` | ✅ | Статический ключ для `X-API-Key`. Генерировать: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"` |

## OCR

| Переменная | Обязательная | Описание |
|------------|-------------|----------|
| `ANTHROPIC_API_KEY` | Только для OCR | Ключ Anthropic API. Получить на [console.anthropic.com](https://console.anthropic.com) |

## Telegram-уведомления

| Переменная | Обязательная | Описание |
|------------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Для алертов | Токен бота — получить у [@BotFather](https://t.me/BotFather) |
| `ADMIN_TELEGRAM_ID` | Для алертов | Твой Telegram ID — получить у [@userinfobot](https://t.me/userinfobot) |

## Frontend (Next.js)

!!! warning "NEXT_PUBLIC_* видны клиенту"
    Переменные с префиксом `NEXT_PUBLIC_` встраиваются в JavaScript-бандл при сборке.
    Не помещать туда секреты — только URL и публичный ключ.

| Переменная | Обязательная | Описание |
|------------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | ✅ | URL API. Локально: `http://localhost:8000/api/v1`. На VPS: `https://your-domain.com/api/v1` |
| `NEXT_PUBLIC_API_KEY` | ✅ | Тот же `API_KEY` — используется frontend для запросов к бэкенду |

## Домен и SSL

| Переменная | Обязательная | Описание |
|------------|-------------|----------|
| `DOMAIN` | ✅ (на VPS) | Доменное имя, например `fuel.example.com` |
| `CERTBOT_EMAIL` | ✅ (на VPS) | Email для Let's Encrypt (уведомления об истечении) |

## Данные автомобиля

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `INITIAL_ODOMETER` | `78700` | Начальный пробег при первом запуске (из Numbers) |
| `CAR_NAME` | `Fielder` | Название автомобиля (отображается в UI) |

## Режим приложения

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `DEBUG` | `false` | `true` — включает Swagger UI (`/api/docs`) и подробные SQL-логи. **Никогда не включать на проде.** |

## GitHub Secrets (для CI/CD)

Настроить в: **GitHub → репозиторий → Settings → Secrets and variables → Actions**

| Secret | Описание |
|--------|----------|
| `SSH_PRIVATE_KEY` | Содержимое `~/.ssh/github-actions-key` (приватный ключ деплоя) |
| `VPS_HOST` | IP-адрес VPS |
| `NEXT_PUBLIC_API_URL` | `https://your-domain.com/api/v1` |
| `NEXT_PUBLIC_API_KEY` | Значение `API_KEY` |
| `TELEGRAM_BOT_TOKEN` | Токен бота для уведомлений о деплое |
| `ADMIN_TELEGRAM_ID` | Твой Telegram ID |

## Генерация безопасных значений

```bash
# API_KEY и POSTGRES_PASSWORD — генерировать случайные:
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Пример вывода:
# 3Kx9mZ2vQpL8nR4wYjH1sTbN7cFdUeAo
```
