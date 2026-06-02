"""
Telegram notifications for production errors.

Модуль отправки уведомлений разработчику в Telegram при сбоях production-сервиса.
Вызывается из глобального обработчика исключений FastAPI в ``src.main``.
"""

import logging

import httpx

from src.config import settings

log = logging.getLogger(__name__)


async def notify_telegram(message: str) -> None:
    """Send error notification to developer via Telegram.

    Отправляет HTML-сообщение в личный чат разработчика через Telegram Bot API.
    Ошибки отправки логируются, но **не прерывают** основной флоу приложения.

    Args:
        message: Текст уведомления. Обрезается до 4000 символов.
            Поддерживает HTML-теги: ``<b>``, ``<code>``, ``<pre>``.

    Note:
        Если ``TELEGRAM_BOT_TOKEN`` или ``ADMIN_TELEGRAM_ID`` не заданы
        в ``.env`` — функция тихо пропускает отправку с warning в лог.

    Example:
        >>> await notify_telegram("💥 Ошибка\\nURL: /api/v1/refuels")
    """
    if not settings.telegram_bot_token or not settings.admin_telegram_id:
        log.warning("Telegram credentials not configured, skipping notification")
        return

    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    payload = {
        "chat_id": settings.admin_telegram_id,
        "text": f"🔴 <b>FuelTracker Error</b>\n\n{message[:4000]}",
        "parse_mode": "HTML",
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                log.error("Telegram notification failed: %s", response.text)
    except Exception as e:
        # Не прерываем основной флоу из-за ошибки уведомления
        log.error("Failed to send Telegram notification: %s", e)
