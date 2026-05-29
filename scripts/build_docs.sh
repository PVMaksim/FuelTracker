#!/bin/bash
# =============================================================================
# build_docs.sh — Локальная сборка и предпросмотр документации
#
# Использование:
#   ./scripts/build_docs.sh          # Сборка + открыть в браузере (live reload)
#   ./scripts/build_docs.sh --build  # Только сборка в ./site/
#   ./scripts/build_docs.sh --ts     # Сгенерировать TypeDoc + MkDocs
# =============================================================================
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[docs]${NC} $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC} $*"; }

# --- Проверка зависимостей ---
check_deps() {
  if ! command -v python3 &>/dev/null; then
    echo "❌ Python 3 не найден. Установи через Homebrew: brew install python"
    exit 1
  fi

  if ! python3 -c "import mkdocs" &>/dev/null; then
    info "Устанавливаю зависимости MkDocs..."
    pip3 install -r docs-requirements.txt
  fi
}

# --- Генерация TypeDoc (TypeScript → Markdown) ---
generate_typedoc() {
  info "Генерирую TypeDoc для frontend/lib/..."

  cd frontend

  if ! command -v npx &>/dev/null; then
    warn "npx не найден — пропускаю TypeDoc"
    cd ..
    return
  fi

  # Установить typedoc если нет
  if [ ! -d node_modules/typedoc ]; then
    npm install --save-dev typedoc typedoc-plugin-markdown
  fi

  npx typedoc --options typedoc.json
  info "TypeDoc готов → docs/frontend/typedoc/"
  cd ..
}

# --- Основная логика ---
check_deps

MODE="${1:---serve}"

case "$MODE" in
  --ts)
    generate_typedoc
    info "Собираю MkDocs с TypeDoc..."
    mkdocs build --strict
    info "✅ Документация собрана в ./site/"
    ;;

  --build)
    info "Собираю MkDocs..."
    mkdocs build --strict
    info "✅ Документация собрана в ./site/"
    info "Открыть: open site/index.html"
    ;;

  --serve | *)
    info "Запускаю MkDocs с live reload..."
    info "Открой в браузере: http://127.0.0.1:8001"
    info "Ctrl+C для остановки"
    echo ""
    mkdocs serve --dev-addr 127.0.0.1:8001
    ;;
esac
