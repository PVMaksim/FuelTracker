# Расчёты топлива

Вся математика вынесена в единый модуль. Не дублировать логику в роутерах или сервисах.

## Формулы

| Показатель | Формула | Пример |
|------------|---------|--------|
| Литры | `total_cost ÷ fuel_price` | 2340 ÷ 58.5 = **40.0 л** |
| Расход | `liters ÷ distance × 100` | 40 ÷ 540 × 100 = **7.41 л/100** |
| Дистанция | `current − previous odometer` | 79240 − 78700 = **540 км** |
| Стоимость км | `total_cost ÷ distance` | 2340 ÷ 540 = **4.33 ₽/км** |

## Автогенерация API-референса

::: src.services.calculations
    options:
      show_root_heading: true
      show_source: true

## Зеркало на фронтенде

Те же расчёты в `frontend/lib/calculations.ts` — для live-preview и офлайн-режима.

`frontend/lib/calculations.test.ts` (Vitest) автоматически проверяет идентичность результатов с Python-версией.

!!! warning "Правило синхронности"
    При изменении формул — обновить **оба** файла: `calculations.py` и `calculations.ts`.
    Запустить оба тест-сюита: `pytest tests/test_calculations.py` и `npm test`.
