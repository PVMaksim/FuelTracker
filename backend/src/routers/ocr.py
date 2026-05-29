"""
Receipt OCR via OpenRouter API (vision).
Rate limit: 10 запросов в час.
"""
import base64
import json
import logging
import re

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from src.config import settings
from src.routers.refuels import verify_api_key

router = APIRouter(tags=["ocr"])
log = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OCR_MODEL = settings.ocr_model

OCR_PROMPT = """Ты анализируешь фотографию чека с автозаправочной станции.
Верни ТОЛЬКО JSON без пояснений:
{"total_cost": <сумма>, "liters": <литры>, "price_per_liter": <цена/л>, "station": "<АЗС или null>"}
Числа без пробелов и символов валюты. Если не найдено — null."""


class OCRResult(BaseModel):
    total_cost: float | None = None
    liters: float | None = None
    price_per_liter: float | None = None
    station: str | None = None
    raw_response: str = ""


@router.post("/ocr/receipt", response_model=OCRResult)
@limiter.limit("10/hour")
async def analyze_receipt(
    request: Request,
    file: UploadFile = File(...),
    _: str = Depends(verify_api_key),
):
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="OCR не настроен")

    image_data = await file.read()
    if len(image_data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Файл > 10MB")

    image_b64 = base64.standard_b64encode(image_data).decode("utf-8")
    media_type = file.content_type or "image/jpeg"

    payload = {
        "model": OCR_MODEL,
        "max_tokens": 300,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{image_b64}"}},
                {"type": "text", "text": OCR_PROMPT},
            ],
        }],
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                OPENROUTER_URL,
                json=payload,
                headers={"Authorization": f"Bearer {settings.anthropic_api_key}",
                         "Content-Type": "application/json"},
            )
            resp.raise_for_status()

        full_resp = resp.json()
        print("===OCR RESPONSE===", str(full_resp)[:500], flush=True)
        raw_text = full_resp["choices"][0]["message"]["content"].strip()
        log.warning("OCR raw: %s", raw_text[:300])
        log.info("OCR raw response: %s", raw_text[:300])

        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError:
            m = re.search(r"\{.*\}", raw_text, re.DOTALL)
            parsed = json.loads(m.group()) if m else {}

        return OCRResult(
            total_cost=parsed.get("total_cost"),
            liters=parsed.get("liters"),
            price_per_liter=parsed.get("price_per_liter"),
            station=parsed.get("station"),
            raw_response=raw_text,
        )
    except Exception as e:
        log.error("OCR error: %s", e)
        raise HTTPException(status_code=502, detail="Ошибка OCR")


class OdometerResult(BaseModel):
    odometer: int | None = None
    raw_response: str = ""


@router.post("/ocr/odometer", response_model=OdometerResult)
@limiter.limit("10/hour")
async def analyze_odometer(
    request: Request,
    file: UploadFile = File(...),
    _: str = Depends(verify_api_key),
):
    """Распознать показание одометра с фото."""
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="OCR не настроен")

    image_data = await file.read()
    if len(image_data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Файл > 10MB")

    image_b64 = base64.standard_b64encode(image_data).decode("utf-8")
    media_type = file.content_type or "image/jpeg"

    payload = {
        "model": settings.ocr_model,
        "max_tokens": 100,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{image_b64}"}},
                {"type": "text", "text": 'На фото показание одометра автомобиля. Верни ТОЛЬКО число — целое количество километров без пробелов, запятых и единиц измерения. Только цифры. Например: 278456'},
            ],
        }],
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                OPENROUTER_URL, json=payload,
                headers={"Authorization": f"Bearer {settings.anthropic_api_key}",
                         "Content-Type": "application/json"},
            )
            resp.raise_for_status()

        raw_text = resp.json()["choices"][0]["message"]["content"].strip()
        digits = re.sub(r"[^\d]", "", raw_text)
        odometer = int(digits) if digits else None

        return OdometerResult(odometer=odometer, raw_response=raw_text)
    except Exception as e:
        log.error("Odometer OCR error: %s", e)
        raise HTTPException(status_code=502, detail="Ошибка OCR")


class RepairItem(BaseModel):
    description: str
    amount: float
    is_part: bool


class RepairOCRResult(BaseModel):
    items: list[RepairItem] = []
    raw_response: str = ""


@router.post("/ocr/repair", response_model=RepairOCRResult)
@limiter.limit("10/hour")
async def analyze_repair_receipt(
    request: Request,
    file: UploadFile = File(...),
    _: str = Depends(verify_api_key),
):
    """Распознать чек ремонта — вернуть все позиции с разделением запчасти/работы."""
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="OCR не настроен")

    image_data = await file.read()
    if len(image_data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Файл > 10MB")

    image_b64 = base64.standard_b64encode(image_data).decode("utf-8")
    media_type = file.content_type or "image/jpeg"

    prompt = """На фото чек автосервиса или магазина автозапчастей.
Извлеки ВСЕ позиции и верни JSON массив без пояснений:
[{"description": "название позиции", "amount": 1234.56, "is_part": true}]

is_part=true — если это запчасть, деталь, материал, расходник
is_part=false — если это работа, услуга, замена, диагностика

Только JSON массив, без markdown."""

    payload = {
        "model": settings.ocr_model,
        "max_tokens": 1000,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{image_b64}"}},
                {"type": "text", "text": prompt},
            ],
        }],
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                OPENROUTER_URL, json=payload,
                headers={"Authorization": f"Bearer {settings.anthropic_api_key}",
                         "Content-Type": "application/json"},
            )
            resp.raise_for_status()

        raw_text = resp.json()["choices"][0]["message"]["content"].strip()

        try:
            arr = json.loads(raw_text)
        except json.JSONDecodeError:
            m = re.search(r"\[.*\]", raw_text, re.DOTALL)
            arr = json.loads(m.group()) if m else []

        items = []
        for row in arr:
            try:
                items.append(RepairItem(
                    description=str(row.get("description", "")),
                    amount=float(row.get("amount", 0)),
                    is_part=bool(row.get("is_part", False)),
                ))
            except Exception:
                continue

        return RepairOCRResult(items=items, raw_response=raw_text)

    except Exception as e:
        log.error("Repair OCR error: %s", e)
        raise HTTPException(status_code=502, detail="Ошибка OCR")
