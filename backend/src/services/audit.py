"""
Audit log — журнал всех операций с заправками.
"""
import json
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

# На сервере зададим через ENV, локально пишем в папку logs/ проекта
AUDIT_LOG_PATH = Path(os.getenv("AUDIT_LOG_PATH", "logs/audit.jsonl"))


def log_action(action: str, data: dict[str, Any]) -> None:
    """Записывает действие в audit log."""
    try:
        AUDIT_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with AUDIT_LOG_PATH.open("a", encoding="utf-8") as f:
            f.write(json.dumps({
                "ts": datetime.now(UTC).isoformat(),
                "action": action,
                "data": data,
            }, ensure_ascii=False) + "\n")
    except Exception:
        # В тестах или при отсутствии прав просто игнорируем, чтобы не ломать основной флоу
        pass
