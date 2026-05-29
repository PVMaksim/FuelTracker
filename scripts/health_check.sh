#!/bin/bash
# =============================================================================
# health_check.sh — Проверка состояния всех сервисов FuelTracker
# =============================================================================
set -euo pipefail

source "$(dirname "$0")/../.env"

DOMAIN="${DOMAIN:-localhost}"
API_KEY="${API_KEY:-}"

echo "🔍 FuelTracker Health Check"
echo "================================"

# 1. Docker контейнеры
echo ""
echo "📦 Docker контейнеры:"
docker compose -f /home/deploy/fuel-tracker/docker-compose.yml ps

# 2. API health endpoint
echo ""
echo "🌐 API health check:"
STATUS=$(curl -sf "https://$DOMAIN/api/health" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null || echo "FAILED")
if [ "$STATUS" = "ok" ]; then
  echo "  ✅ API: OK"
else
  echo "  🔴 API: $STATUS"
fi

# 3. База данных
echo ""
echo "🗄️ PostgreSQL:"
docker compose -f /home/deploy/fuel-tracker/docker-compose.yml exec -T db \
  pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" && echo "  ✅ PostgreSQL: OK" || echo "  🔴 PostgreSQL: FAILED"

echo ""
echo "================================"
echo "✅ Проверка завершена"
