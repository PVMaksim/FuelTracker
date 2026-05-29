#!/usr/bin/env python3
"""
Script name: import_numbers.py
Purpose: Import historical fuel data from Apple Numbers CSV export
Назначение: Импорт исторических данных заправок из CSV-экспорта Apple Numbers

Как использовать:
1. Открыть Numbers → Файл → Экспортировать → CSV
2. Запустить: python scripts/import_numbers.py --file ~/Downloads/expenses.csv --dry-run
3. Проверить вывод, убрать --dry-run для реального импорта
"""
import argparse
import csv
import logging
import sys
from datetime import datetime
from pathlib import Path

import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", required=True, help="Путь к CSV файлу из Numbers")
    parser.add_argument("--api-url", default="http://localhost:8000/api/v1", help="URL API")
    parser.add_argument("--api-key", required=True, help="API ключ (X-API-Key)")
    parser.add_argument("--dry-run", action="store_true", help="Запуск без реального импорта")
    parser.add_argument(
        "--odometer-col", type=int, default=None,
        help="Номер колонки с пробегом (0-based). Если не указан — интерактивный выбор"
    )
    parser.add_argument(
        "--cost-col", type=int, default=None,
        help="Номер колонки с суммой (0-based)"
    )
    parser.add_argument(
        "--price-col", type=int, default=None,
        help="Номер колонки с ценой за литр (0-based)"
    )
    parser.add_argument(
        "--date-col", type=int, default=None,
        help="Номер колонки с датой (0-based)"
    )
    return parser.parse_args()


def show_preview(file_path: Path) -> list[list[str]]:
    """Показать первые строки CSV для выбора колонок."""
    with open(file_path, encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        rows = [row for _, row in zip(range(10), reader)]

    print("\n📋 Превью файла:")
    print(f"{'#':<4}", end="")
    for i, col in enumerate(rows[0]):
        print(f"  [{i}] {col[:15]:<15}", end="")
    print()

    for row in rows[1:6]:
        for cell in row:
            print(f"  {'':>4}{cell[:18]:<18}", end="")
        print()

    return rows


def select_column(prompt: str, default: int | None, rows: list[list[str]]) -> int:
    """Интерактивный выбор колонки."""
    if default is not None:
        return default
    while True:
        try:
            val = input(f"\n{prompt} (введи номер [0-{len(rows[0])-1}]): ").strip()
            idx = int(val)
            if 0 <= idx < len(rows[0]):
                return idx
            print("Неверный номер колонки")
        except ValueError:
            print("Введи число")


def parse_number(value: str) -> float | None:
    """Парсинг числа из строки (удаление пробелов, замена запятой на точку)."""
    cleaned = value.strip().replace(" ", "").replace(",", ".").replace("₽", "").replace("л", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_date(value: str) -> datetime | None:
    """Парсинг даты в различных форматах."""
    formats = ["%d.%m.%Y", "%d.%m.%y", "%Y-%m-%d", "%d/%m/%Y"]
    for fmt in formats:
        try:
            return datetime.strptime(value.strip(), fmt)
        except ValueError:
            continue
    return None


def main() -> int:
    args = parse_args()
    file_path = Path(args.file)

    if not file_path.exists():
        log.error("Файл не найден: %s", file_path)
        return 1

    rows = show_preview(file_path)

    # Выбор колонок
    odometer_col = select_column("Колонка с пробегом (км)", args.odometer_col, rows)
    cost_col = select_column("Колонка с суммой заправки (₽)", args.cost_col, rows)
    price_col = select_column("Колонка с ценой за литр (₽)", args.price_col, rows)
    date_col = select_column("Колонка с датой", args.date_col, rows)

    log.info("Колонки: пробег=%d, сумма=%d, цена=%d, дата=%d",
             odometer_col, cost_col, price_col, date_col)

    # Парсинг данных
    records = []
    with open(file_path, encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        next(reader)  # Пропустить заголовок
        for line_num, row in enumerate(reader, start=2):
            if len(row) <= max(odometer_col, cost_col, price_col, date_col):
                continue

            odometer = parse_number(row[odometer_col])
            cost = parse_number(row[cost_col])
            price = parse_number(row[price_col])
            date = parse_date(row[date_col])

            if not all([odometer, cost, price]):
                log.debug("Строка %d пропущена (нет данных): %s", line_num, row)
                continue

            records.append({
                "odometer": int(odometer),
                "total_cost": cost,
                "fuel_price": price,
                "created_at": date.isoformat() if date else None,
                "local_id": f"import-{line_num}",
            })

    log.info("Найдено записей для импорта: %d", len(records))

    if args.dry_run:
        log.info("DRY RUN — реальная отправка пропущена")
        for r in records[:5]:
            log.info("  %s", r)
        return 0

    # Отправка на API
    headers = {"X-API-Key": args.api_key}
    try:
        response = httpx.post(
            f"{args.api_url}/refuels/bulk",
            json=records,
            headers=headers,
            timeout=30.0,
        )
        response.raise_for_status()
        results = response.json()

        created = sum(1 for r in results if r.get("status") == "created")
        skipped = sum(1 for r in results if r.get("status") == "skipped")
        errors = sum(1 for r in results if r.get("status") == "error")

        log.info("✅ Импорт завершён: создано=%d, пропущено=%d, ошибок=%d", created, skipped, errors)
        return 0

    except httpx.HTTPError as e:
        log.error("Ошибка запроса к API: %s", e)
        return 1


if __name__ == "__main__":
    sys.exit(main())
