#!/usr/bin/env python3
"""Просмотр и экспорт audit лога FuelTracker."""
import json
import argparse
from pathlib import Path

AUDIT_FILE = Path("/home/deploy/FuelTracker/logs/audit.jsonl")

def load_entries():
    if not AUDIT_FILE.exists():
        print("Audit log пуст или не создан")
        return []
    entries = []
    with AUDIT_FILE.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return entries

def format_entry(e):
    ts = e.get("ts", "?")
    action = e.get("action", "?")
    data = e.get("data", {})
    icons = {"create_refuel": "+", "update_refuel": "~", "delete_refuel": "-", "sync_bulk": "*"}
    icon = icons.get(action, "?")
    parts = []
    if "date" in data: parts.append(f"date={data['date']}")
    if "liters" in data: parts.append(f"liters={data['liters']}")
    if "odometer" in data: parts.append(f"odometer={data['odometer']}")
    if "id" in data: parts.append(f"id={data['id']}")
    data_str = ", ".join(parts) if parts else str(data)
    return f"{icon} {ts} | {action:20} | {data_str}"

def main():
    parser = argparse.ArgumentParser(description="Audit log viewer")
    parser.add_argument("--last", type=int, help="Показать последние N записей")
    parser.add_argument("--action", type=str, help="Фильтр по действию")
    parser.add_argument("--date", type=str, help="Фильтр по дате (YYYY-MM-DD)")
    parser.add_argument("--export", type=str, help="Экспорт в CSV файл")
    args = parser.parse_args()
    entries = load_entries()
    if not entries: return
    if args.action: entries = [e for e in entries if e.get("action") == args.action]
    if args.date: entries = [e for e in entries if e.get("ts", "").startswith(args.date)]
    if args.last: entries = entries[-args.last:]
    if args.export:
        with open(args.export, "w", encoding="utf-8") as f:
            f.write("timestamp,action,data\n")
            for e in entries:
                data_json = json.dumps(e.get("data", {}), ensure_ascii=False)
                f.write(f"{e.get('ts')},{e.get('action')},\"{data_json}\"\n")
        print(f"Exported {len(entries)} entries to {args.export}")
        return
    print(f"Audit log: {len(entries)} entries\n")
    for e in entries: print(format_entry(e))

if __name__ == "__main__":
    main()
