#!/bin/bash
# =============================================================================
# init_ssl.sh — Первичный выпуск SSL-сертификата Let's Encrypt
# Запускать ОДИН РАЗ на чистом сервере до запуска docker-compose up
# =============================================================================
set -euo pipefail

# --- Загрузить переменные из .env ---
if [ ! -f .env ]; then
  echo "❌ Файл .env не найден. Скопируй .env.example и заполни."
  exit 1
fi
source .env

DOMAIN="${DOMAIN:?DOMAIN не задан в .env}"
EMAIL="${CERTBOT_EMAIL:?CERTBOT_EMAIL не задан в .env}"

echo "🔐 Выпускаем сертификат для: $DOMAIN"
echo "📧 Email: $EMAIL"

# 1. Запустить только nginx (для прохождения ACME challenge)
#    nginx.conf должен уже обслуживать /.well-known/acme-challenge/ из /var/www/certbot
docker compose up -d nginx

# 2. Запустить certbot в standalone режиме
docker run --rm \
  -v "$(pwd)/certbot_certs:/etc/letsencrypt" \
  -v "$(pwd)/certbot_webroot:/var/www/certbot" \
  certbot/certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

# 3. Заменить DOMAIN_PLACEHOLDER в nginx.conf
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" docker/nginx.conf
echo "✅ nginx.conf обновлён для домена $DOMAIN"

# 4. Перезапустить nginx с новым сертификатом
docker compose restart nginx

echo ""
echo "✅ SSL сертификат выпущен!"
echo "🌐 Открой: https://$DOMAIN"
echo ""
echo "Следующий шаг: запустить всё приложение:"
echo "  docker compose up -d"
