/**
 * Tests for fuel consumption calculations.
 * Mirrors test_calculations.py — guarantees identical results in offline mode.
 */
import { describe, it, expect } from "vitest";
import {
  calculateLiters,
  calculateConsumption,
  calculateDistance,
  calculateCostPerKm,
} from "./calculations";

// ── calculateLiters ────────────────────────────────────────────────────────

describe("calculateLiters", () => {
  it("basic: 2340 / 58.5 = 40.0", () => {
    expect(calculateLiters(2340, 58.5)).toBe(40.0);
  });

  it("rounds down: 100 / 7 = 14.29", () => {
    expect(calculateLiters(100, 7)).toBe(14.29);
  });

  it("rounds up: 100 / 3 = 33.33", () => {
    expect(calculateLiters(100, 3)).toBe(33.33);
  });

  it("no float artifacts: 2340 / 58.5 === 40.0 exactly", () => {
    const result = calculateLiters(2340, 58.5);
    expect(result).toBe(40.0);
  });

  it("throws on zero price", () => {
    expect(() => calculateLiters(2340, 0)).toThrow();
  });

  it("throws on negative price", () => {
    expect(() => calculateLiters(2340, -10)).toThrow();
  });
});

// ── calculateConsumption ───────────────────────────────────────────────────

describe("calculateConsumption", () => {
  it("basic: 40л / 540км = 7.41", () => {
    expect(calculateConsumption(40, 540)).toBe(7.41);
  });

  it("returns undefined for zero distance", () => {
    expect(calculateConsumption(40, 0)).toBeUndefined();
  });

  it("returns undefined for null distance", () => {
    expect(calculateConsumption(40, null as any)).toBeUndefined();
  });

  it("returns undefined for undefined distance", () => {
    expect(calculateConsumption(40, undefined)).toBeUndefined();
  });

  it("high consumption 12л/100", () => {
    expect(calculateConsumption(60, 500)).toBe(12.0);
  });

  it("low consumption 5л/100", () => {
    expect(calculateConsumption(25, 500)).toBe(5.0);
  });
});

// ── calculateDistance ─────────────────────────────────────────────────────

describe("calculateDistance", () => {
  it("basic: 79240 - 78700 = 540", () => {
    expect(calculateDistance(79240, 78700)).toBe(540);
  });

  it("returns undefined for null previous", () => {
    expect(calculateDistance(78700, null)).toBeUndefined();
  });

  it("large distance", () => {
    expect(calculateDistance(100000, 99000)).toBe(1000);
  });

  it("same odometer returns 0", () => {
    expect(calculateDistance(78700, 78700)).toBe(0);
  });
});

// ── calculateCostPerKm ────────────────────────────────────────────────────

describe("calculateCostPerKm", () => {
  it("basic: 2340 / 540 = 4.33", () => {
    expect(calculateCostPerKm(2340, 540)).toBe(4.33);
  });

  it("returns undefined for zero distance", () => {
    expect(calculateCostPerKm(2340, 0)).toBeUndefined();
  });

  it("returns undefined for null distance", () => {
    expect(calculateCostPerKm(2340, null)).toBeUndefined();
  });
});

// ── Full cycle ────────────────────────────────────────────────────────────

describe("full refuel cycle", () => {
  it("matches Python test_complete_refuel_calculation", () => {
    const liters      = calculateLiters(2340, 58.5);
    const distance    = calculateDistance(79240, 78700);
    const consumption = calculateConsumption(liters, distance!);
    const costPerKm   = calculateCostPerKm(2340, distance!);

    expect(liters).toBe(40.0);
    expect(distance).toBe(540);
    expect(consumption).toBe(7.41);
    expect(costPerKm).toBe(4.33);
  });

  it("first refuel — no consumption or distance", () => {
    const liters      = calculateLiters(3000, 60);
    const distance    = calculateDistance(78700, null);
    const consumption = calculateConsumption(liters, distance!);

    expect(liters).toBe(50.0);
    expect(distance).toBeUndefined();
    expect(consumption).toBeUndefined();
  });
});
