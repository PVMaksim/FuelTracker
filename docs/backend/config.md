# Конфигурация

Все настройки загружаются **только из переменных окружения** через Pydantic Settings.  
Никаких захардкоженных значений в коде.

## Автогенерация референса

::: src.config
    options:
      show_root_heading: true
      show_source: true

## Добавление новой настройки

1. Добавить поле в класс `Settings` в `backend/src/config.py`
2. Добавить соответствующую строку в `.env.example` с описанием
3. Добавить в GitHub Secrets если нужно для CI/CD
