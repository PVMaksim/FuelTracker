"""
Fuel consumption calculation logic.

Единый модуль расчётов расхода топлива.
Зеркалируется на фронтенде в ``frontend/lib/calculations.ts``.
При изменении формул — обновлять оба файла.
"""
from decimal import Decimal, ROUND_HALF_UP


def calculate_liters(total_cost: float, fuel_price: float) -> float:
    """Calculate liters filled from total cost and price per liter.

    Рассчитывает количество литров: ``total_cost / fuel_price``.
    Результат округляется до 2 знаков.

    Args:
        total_cost: Сумма заправки в рублях (> 0).
        fuel_price: Цена за литр в рублях (> 0).

    Returns:
        Количество литров, округлённое до 0.01.

    Raises:
        ValueError: Если ``fuel_price`` ≤ 0.

    Example:
        >>> calculate_liters(2340.0, 58.5)
        40.0
    """
    if fuel_price <= 0:
        raise ValueError("Цена за литр должна быть больше нуля")
    result = Decimal(str(total_cost)) / Decimal(str(fuel_price))
    return float(result.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def calculate_consumption(liters: float, distance: int) -> float | None:
    """Calculate fuel consumption per 100 km.

    Рассчитывает расход в литрах на 100 км: ``liters / distance * 100``.

    Args:
        liters: Количество заправленных литров.
        distance: Пробег с предыдущей заправки в км.

    Returns:
        Расход л/100км, округлённый до 0.01.
        ``None`` если ``distance`` ≤ 0 (первая запись, нет предыдущего пробега).

    Example:
        >>> calculate_consumption(40.0, 540)
        7.41
    """
    if distance is None or distance <= 0:
        return None
    result = (Decimal(str(liters)) / Decimal(str(distance))) * 100
    return float(result.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def calculate_distance(current_odometer: int, previous_odometer: int | None) -> int | None:
    """Calculate distance driven since last refuel.

    Рассчитывает пробег с предыдущей заправки.

    Args:
        current_odometer: Текущий пробег в км.
        previous_odometer: Пробег на момент предыдущей заправки.
            ``None`` если это первая запись.

    Returns:
        Пробег в км или ``None`` если предыдущей записи нет.

    Example:
        >>> calculate_distance(79240, 78700)
        540
        >>> calculate_distance(78700, None)
        None
    """
    if previous_odometer is None:
        return None
    return current_odometer - previous_odometer


def calculate_cost_per_km(total_cost: float, distance: int | None) -> float | None:
    """Calculate fuel cost per kilometer.

    Рассчитывает стоимость топлива в рублях на 1 км пробега.

    Args:
        total_cost: Сумма заправки в рублях.
        distance: Пробег с предыдущей заправки в км.

    Returns:
        Стоимость ₽/км, округлённая до 0.01.
        ``None`` если ``distance`` не задан или ≤ 0.

    Example:
        >>> calculate_cost_per_km(2340.0, 540)
        4.33
    """
    if not distance or distance <= 0:
        return None
    result = Decimal(str(total_cost)) / Decimal(str(distance))
    return float(result.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
