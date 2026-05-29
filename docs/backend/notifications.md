# Telegram-уведомления об ошибках

Каждая необработанная ошибка в production автоматически отправляется в Telegram.

## Как работает

```mermaid
sequenceDiagram
    participant User as Пользователь
    participant API as FastAPI
    participant TG as Telegram Bot

    User->>API: Запрос
    API->>API: 💥 Необработанная ошибка
    API->>TG: notify_telegram(message)
    API-->>User: 500 Internal Server Error
    TG-->>Developer: 🔴 FuelTracker Error\nURL: ...\nОшибка: ...
```

## Автогенерация референса

::: src.services.notifications
    options:
      show_root_heading: true
      show_source: true

## Настройка

В `.env`:
```bash
TELEGRAM_BOT_TOKEN=   # Получить у @BotFather
ADMIN_TELEGRAM_ID=    # Получить у @userinfobot
```

!!! note "Отдельный бот"
    Рекомендуется создать отдельного бота только для алертов через @BotFather,
    не использовать токен основного бота (если он есть).
