# Резервные копии

## Автоматический бэкап (cron)

Скрипт `scripts/backup.sh` делает дамп PostgreSQL и хранит 7 последних копий.

```bash
# Добавить в crontab на VPS (дамп каждую ночь в 3:00)
crontab -e

# Добавить строку:
0 3 * * * /home/deploy/fuel-tracker/scripts/backup.sh >> /var/log/fuel-backup.log 2>&1
```

Бэкапы сохраняются в `/home/deploy/backups/fuel-tracker/`:

```
fuel_tracker_20260430_030001.sql.gz
fuel_tracker_20260429_030001.sql.gz
...  (хранится 7 дней, старые удаляются автоматически)
```

## Ручной бэкап

```bash
# Создать дамп немедленно
/home/deploy/fuel-tracker/scripts/backup.sh

# Или напрямую через Docker
docker compose exec db pg_dump -U fuel_user fuel_tracker | \
  gzip > ~/backup_$(date +%Y%m%d).sql.gz
```

## Восстановление из бэкапа

```bash
# 1. Остановить приложение
cd /home/deploy/fuel-tracker
docker compose stop backend

# 2. Восстановить дамп
gunzip -c /home/deploy/backups/fuel-tracker/fuel_tracker_20260430_030001.sql.gz | \
  docker compose exec -T db psql -U fuel_user fuel_tracker

# 3. Запустить обратно
docker compose start backend
```

## Скачать бэкап на Mac

```bash
# Скопировать последний бэкап с VPS на Mac
scp deploy@YOUR_VPS_IP:/home/deploy/backups/fuel-tracker/$(ssh deploy@YOUR_VPS_IP \
  "ls -t /home/deploy/backups/fuel-tracker/ | head -1") ~/Desktop/
```

!!! warning "Важно"
    Бэкапы хранятся на том же сервере — это защита от случайного удаления данных,
    но не от падения VPS. Периодически скачивай бэкапы на Mac командой выше.
