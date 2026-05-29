"""
Tests for fuel consumption calculation logic.
Тесты расчётов расхода топлива — покрывают все граничные случаи.
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from src.services.calculations import (
    calculate_liters,
    calculate_consumption,
    calculate_distance,
)


# ─────────────────────────────────────────────
# calculate_liters
# ─────────────────────────────────────────────

class TestCalculateLiters:
    def test_basic_division(self):
        """Стандартная заправка: 2340₽ / 58.50₽ = 40.00л."""
        assert calculate_liters(2340.0, 58.50) == 40.0

    def test_rounding_up(self):
        """Округление вверх: 100 / 3 = 33.33л."""
        assert calculate_liters(100.0, 3.0) == 33.33

    def test_rounding_down(self):
        """Округление вниз до 2 знаков."""
        assert calculate_liters(100.0, 7.0) == 14.29

    def test_small_amount(self):
        """Маленькая заправка."""
        assert calculate_liters(500.0, 58.5) == 8.55

    def test_large_amount(self):
        """Большая заправка — полный бак."""
        assert calculate_liters(5000.0, 62.0) == 80.65

    def test_integer_result(self):
        """Ровное количество литров."""
        assert calculate_liters(1000.0, 50.0) == 20.0

    def test_zero_price_raises(self):
        """Цена 0 должна вызывать ValueError."""
        with pytest.raises(ValueError, match="Цена за литр должна быть больше нуля"):
            calculate_liters(2340.0, 0)

    def test_negative_price_raises(self):
        """Отрицательная цена должна вызывать ValueError."""
        with pytest.raises(ValueError):
            calculate_liters(2340.0, -10.0)

    def test_float_precision(self):
        """Результат не содержит артефактов float: 2340 / 58.5 ≠ 39.999999..."""
        result = calculate_liters(2340.0, 58.5)
        assert result == 40.0
        assert isinstance(result, float)


# ─────────────────────────────────────────────
# calculate_consumption
# ─────────────────────────────────────────────

class TestCalculateConsumption:
    def test_basic_consumption(self):
        """40л / 540км * 100 = 7.41 л/100км."""
        assert calculate_consumption(40.0, 540) == 7.41

    def test_high_consumption(self):
        """Высокий расход: 12л/100км."""
        assert calculate_consumption(60.0, 500) == 12.0

    def test_low_consumption(self):
        """Низкий расход: ~5л/100км."""
        assert calculate_consumption(25.0, 500) == 5.0

    def test_zero_distance_returns_none(self):
        """Нулевой пробег → None (первая запись или дубль)."""
        assert calculate_consumption(40.0, 0) is None

    def test_negative_distance_returns_none(self):
        """Отрицательный пробег → None."""
        assert calculate_consumption(40.0, -100) is None

    def test_none_distance_returns_none(self):
        """None пробег (первая запись) → None."""
        assert calculate_consumption(40.0, None) is None  # type: ignore

    def test_rounding(self):
        """Результат округлён до 2 знаков."""
        result = calculate_consumption(33.0, 420)
        assert result == 7.86
        # Не 7.857142857...
        assert len(str(result).split(".")[-1]) <= 2

    def test_very_short_trip(self):
        """Очень короткая поездка — расход будет большим, но считается."""
        result = calculate_consumption(5.0, 50)
        assert result == 10.0


# ─────────────────────────────────────────────
# calculate_distance
# ─────────────────────────────────────────────

class TestCalculateDistance:
    def test_basic_distance(self):
        """79240 - 78700 = 540км."""
        assert calculate_distance(79240, 78700) == 540

    def test_first_entry_returns_none(self):
        """Первая запись — нет предыдущего пробега → None."""
        assert calculate_distance(78700, None) is None

    def test_large_distance(self):
        """Длинный пробег между заправками."""
        assert calculate_distance(100000, 99000) == 1000

    def test_small_distance(self):
        """Короткий пробег — заправились дважды подряд."""
        assert calculate_distance(78750, 78700) == 50

    def test_same_odometer(self):
        """Одинаковый пробег (не должно происходить, но не падаем)."""
        assert calculate_distance(78700, 78700) == 0


# ─────────────────────────────────────────────
# Интеграционный тест: полный цикл заправки
# ─────────────────────────────────────────────

class TestFullRefuelCycle:
    def test_complete_refuel_calculation(self):
        """Полный цикл: от ввода данных до итоговых показателей."""
        # Вводные данные (как пользователь вводит в форму)
        odometer_now  = 79_240
        odometer_prev = 78_700
        total_cost    = 2_340.0
        fuel_price    = 58.5

        # Расчёты
        liters      = calculate_liters(total_cost, fuel_price)
        distance    = calculate_distance(odometer_now, odometer_prev)
        consumption = calculate_consumption(liters, distance)

        assert liters      == 40.0
        assert distance    == 540
        assert consumption == 7.41

    def test_first_refuel_no_consumption(self):
        """Первая заправка — расход не считается (нет предыдущего пробега)."""
        liters      = calculate_liters(3000.0, 60.0)
        distance    = calculate_distance(78_700, None)
        consumption = calculate_consumption(liters, distance)

        assert liters   == 50.0
        assert distance is None
        assert consumption is None
