/**
 * Fuel consumption calculation logic (mirrors backend calculations.py).
 * Расчёты расхода топлива — зеркало бэкенда для офлайн-работы.
 */

/** Рассчитать количество литров: сумма / цена за литр. */
export function calculateLiters(totalCost: number, fuelPrice: number): number {
  if (fuelPrice <= 0) throw new Error("Цена за литр должна быть больше нуля");
  return Math.round((totalCost / fuelPrice) * 100) / 100;
}

/** Рассчитать расход топлива: литры / пробег × 100. */
export function calculateConsumption(liters: number, distance: number): number | undefined {
  if (distance <= 0) return undefined;
  return Math.round((liters / distance) * 100 * 100) / 100;
}

/** Рассчитать пробег с предыдущей заправки. */
export function calculateDistance(
  currentOdometer: number,
  previousOdometer: number | null
): number | undefined {
  if (previousOdometer === null) return undefined;
  return currentOdometer - previousOdometer;
}

/** Форматирование числа для отображения (2 знака). */
export function formatNumber(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null) return "—";
  return value.toFixed(decimals);
}

/** Форматирование суммы в рублях. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Форматирование пробега с пробелами: 78700 → "78 700". */
export function formatOdometer(value: number): string {
  return value.toLocaleString("ru-RU");
}

/** Рассчитать стоимость топлива в рублях на 1 км: total_cost / distance. */
export function calculateCostPerKm(totalCost: number, distance: number | undefined | null): number | undefined {
  if (!distance || distance <= 0) return undefined;
  return Math.round((totalCost / distance) * 100) / 100;
}
