# Расчёты (Frontend)

Зеркало `backend/src/services/calculations.py`.

Файл: `frontend/lib/calculations.ts`

## Функции

| Функция | Описание |
|---------|----------|
| `calculateLiters(cost, price)` | Литры = сумма / цена |
| `calculateConsumption(liters, distance)` | Расход л/100км |
| `calculateDistance(current, previous)` | Пробег с предыдущей заправки |
| `formatNumber(value, decimals?)` | Форматирование числа |
| `formatCurrency(value)` | Форматирование в рублях |
| `formatOdometer(value)` | Пробег с пробелами (78 700) |

Используются в форме `/add` для live-preview расчёта прямо во время ввода.
