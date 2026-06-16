## Последняя сессия: 16.06.2026
### Сделано
- ✅ Развернули проект на Beget VPS (193.242.109.48, домен neoxis.store)
- ✅ Настроили HTTPS на порту 9443 (нестандартный, т.к. Beget блокирует 443)
- ✅ Исправили Dockerfile бэкенда: `COPY . .` вместо `COPY src/` + запуск миграций
- ✅ Добавили `DATABASE_URL` в `.env` на сервере
- ✅ Настроили полный `nginx.conf` с SSL, редиректом HTTP→HTTPS, gzip
- ✅ Исправили `NEXT_PUBLIC_API_URL`: убрали `/v1`, добавили порт `:9443`
- ✅ Настроили SSH-доступ по ключу (алиас `ft` на Mac)
- ✅ Все контейнеры работают: backend, frontend, nginx, db (healthy)
- ✅ PWA работает на iPhone и Mac, режим «Офлайн» исчез
- ✅ Миграции Alembic применяются автоматически при старте бэкенда

### Проблемы / Баги
- [x] ~~Бэкенд падал с `Alembic migration failed`~~ — исправлено (добавлен DATABASE_URL + alembic.ini в Docker)
- [x] ~~Nginx не слушал порт 443~~ — исправлено (полный конфиг с mime.types, sendfile)
- [x] ~~Фронтенд показывал «Офлайн»~~ — исправлено (убран `/v1` из API URL)
- [ ] Telegram-уведомления не настроены (credentials not configured)

### Принятые решения
- Использовать порт 9443 для HTTPS (провайдер блокирует 443)
- Хранить `.env` только на сервере (не в Git), секреты в GitHub Actions
- Nginx конфиг должен быть полным (не минимальным) для официального образа `nginx:alpine`
- SSH алиас `ft` для быстрого доступа к серверу

## Предыдущая сессия: 01.05.2026
### Итоговое состояние
- Тесты: 41/41 ✅
- Документация: 27 страниц MkDocs Material ✅
- Всё реализовано (backend, frontend, CI/CD, инфраструктура)

## Следующая сессия
- [ ] Настроить Telegram-уведомления (добавить токен бота в `.env`)
- [ ] Настроить автобэкапы PostgreSQL (cron + Object Storage Beget)
- [ ] Проверить автообновление SSL-сертификатов (Certbot cron)
- [ ] Заменить `datetime.utcnow()` на `datetime.now(timezone.utc)` — убрать deprecation warnings
- [ ] Добавить кнопку удаления в карточку истории (`history/page.tsx`)
- [ ] Написать `tests/test_api_stats.py` и `tests/test_api_export.py`
- [ ] Создать иконки `icon-192.png`, `icon-512.png` для PWA

## Известный технический долг
| Проблема | Файл | Приоритет |
|----------|------|-----------|
| datetime.utcnow() — deprecated Python 3.12 | stats.py, refuel_service.py, tests | Низкий |
| Нет тестов для /stats и /export роутеров | — | Средний |
| Кнопка удаления в истории отсутствует в UI | history/page.tsx | Средний |
| Telegram credentials not configured | backend/src/main.py | Низкий |

## Данные для первого запуска
Начальный пробег из Numbers:
INITIAL_ODOMETER=78700
Импорт исторических данных:
python scripts/import_numbers.py
--file ~/Downloads/expenses.csv
--api-url https://neoxis.store:9443/api/v1
--api-key YOUR_KEY
--dry-run

## Архивы проекта
- `fuel-tracker-v3.tar.gz` — финальный архив (142 файла)