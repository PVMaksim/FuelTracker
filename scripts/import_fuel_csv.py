#!/usr/bin/env python3
"""
Импорт данных из CSV (формат: Дата,Место,Стоимость,Цена,Кол.Литров,Пробег,Расход)
Использование:
    python scripts/import_fuel_csv.py --file Расход.csv --dry-run
    python scripts/import_fuel_csv.py --file Расход.csv
"""
import csv
import re
import sys
import argparse
from datetime import datetime
from pathlib import Path

# Настройки API
API_URL = "https://neoxis.store:9443/api"
API_KEY = "ce68e744414acc7a5c6a1cbe0c70c522322e45"

def parse_date(raw: str) -> str | None:
    """Парсит разные форматы дат → ISO 8601."""
    raw = raw.strip().replace(',', '.').replace('"', '')
    
    # Исправляем опечатки: 28.052026 → 28.05.2026, 5.052026 → 05.05.2026
    match = re.match(r'^(\d{1,2})\.(\d{2})(\d{4})$', raw)
    if match:
        day, month, year = match.groups()
        raw = f"{day.zfill(2)}.{month}.{year}"
    
    # Пробуем форматы
    for fmt in ('%d.%m.%Y', '%d.%m.%y'):
        try:
            return datetime.strptime(raw, fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return None

def parse_float(raw: str) -> float | None:
    try:
        return float(raw.replace(',', '.'))
    except (ValueError, AttributeError):
        return None

def parse_csv(filepath: Path) -> list[dict]:
    records = []
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, 1):
            date = parse_date(row.get('Дата', ''))
            if not date:
                print(f"⚠️  Строка {i}: не распознана дата '{row.get('Дата')}' — пропуск")
                continue
            
            liters = parse_float(row.get('Кол. Литров', ''))
            odometer = parse_float(row.get('Пробег', ''))
            cost = parse_float(row.get('Стоимость', ''))
            price = parse_float(row.get('Цена', ''))
            location = row.get('Место', '').strip() or None
            
            if not liters or not odometer:
                print(f"⚠️  Строка {i} ({date}): нет литров или пробега — пропуск")
                continue
            
            records.append({
                'date': date,
                'location': location,
                'liters': round(liters, 2),
                'odometer': int(odometer),
                'cost': round(cost, 2) if cost else None,
                'price_per_liter': round(price, 2) if price else None,
            })
    return records

def send_to_api(record: dict, dry_run: bool):
    import requests
    payload = {
        'odometer': record['odometer'],
        'fuel_price': record['price_per_liter'],  # ← fuel_price, не price_per_liter
        'total_cost': record['cost'],              # ← total_cost, не cost
        'created_at': record['date'],              # ← created_at, не date
        'location': record['location'],
    }
    
    if dry_run:
        print(f"  → {record['date']} | {record['odometer']} км | {record['liters']} л | {record['cost']} ₽")
        return True
    
    resp = requests.post(
        f"{API_URL}/v1/refuels",
        json=payload,
        headers={'X-API-Key': API_KEY},
        timeout=10,
    )
    if resp.status_code == 201:
        print(f"  ✅ {record['date']} {record['liters']}л @{record['odometer']}км")
        return True
    else:
        print(f"  ❌ {record['date']}: {resp.status_code} {resp.text}")
        return False

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--file', required=True, type=Path)
    parser.add_argument('--dry-run', action='store_true', help='Только показать, не отправлять')
    args = parser.parse_args()
    
    if not args.file.exists():
        print(f"❌ Файл не найден: {args.file}")
        sys.exit(1)
    
    records = parse_csv(args.file)
    print(f"📊 Найдено {len(records)} валидных записей из {args.file}")
    
    if args.dry_run:
        print("\n🔍 DRY RUN — данные не отправляются:\n")
        for r in records[:5]:
            send_to_api(r, dry_run=True)
        if len(records) > 5:
            print(f"  ... и ещё {len(records) - 5} записей")
        return
    
    print(f"\n🚀 Отправка {len(records)} записей на {API_URL}...\n")
    ok = 0
    for r in records:
        if send_to_api(r, dry_run=False):
            ok += 1
    
    print(f"\n✅ Импортировано: {ok}/{len(records)}")

if __name__ == '__main__':
    main()
