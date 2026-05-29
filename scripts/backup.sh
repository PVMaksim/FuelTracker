#!/bin/bash
# =============================================================================
# backup.sh — Дамп PostgreSQL → локальная папка с ротацией (7 дней)
# Запускать по крону: 0 3 * * * /home/deploy/fuel-tracker/scripts/backup.sh
# =============================================================================
set -euo pipefail

source "$(dirname "$0")/../.env"

BACKUP_DIR="/home/deploy/backups/fuel-tracker"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="fuel_tracker_${DATE}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "📦 Создаём бэкап: $FILENAME"

# Дамп PostgreSQL из контейнера
docker compose -f /home/deploy/fuel-tracker/docker-compose.yml exec -T db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_DIR/$FILENAME"

# Ротация: удалить файлы старше 7 дней
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "✅ Бэкап сохранён: $BACKUP_DIR/$FILENAME"
echo "📁 Все бэкапы:"
ls -lh "$BACKUP_DIR"
