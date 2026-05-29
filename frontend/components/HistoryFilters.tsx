"use client";
/**
 * Filter controls for history page.
 * Фильтрация по типу топлива и периоду — без запросов к серверу.
 */
import { type LocalRefuel } from "@/lib/db";

export type PeriodFilter = "30d" | "90d" | "all";
export type FuelTypeFilter = "all" | "92" | "95" | "98" | "diesel";

interface Props {
  fuelType: FuelTypeFilter;
  period: PeriodFilter;
  onFuelType: (v: FuelTypeFilter) => void;
  onPeriod: (v: PeriodFilter) => void;
  totalCount: number;
  filteredCount: number;
}

const FUEL_OPTS: { value: FuelTypeFilter; label: string }[] = [
  { value: "all",    label: "Все"   },
  { value: "92",     label: "АИ-92" },
  { value: "95",     label: "АИ-95" },
  { value: "98",     label: "АИ-98" },
  { value: "diesel", label: "ДТ"    },
];

const PERIOD_OPTS: { value: PeriodFilter; label: string }[] = [
  { value: "30d", label: "30 дней"  },
  { value: "90d", label: "3 месяца" },
  { value: "all", label: "Всё"      },
];

export function HistoryFilters({
  fuelType, period, onFuelType, onPeriod, totalCount, filteredCount,
}: Props) {
  return (
    <div className="space-y-2 mb-4">
      {/* Тип топлива */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FUEL_OPTS.map(({ value, label }) => (
          <button key={value} onClick={() => onFuelType(value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
              ${fuelType === value
                ? "bg-brand-500 text-white"
                : "bg-surface-700 text-slate-400 hover:text-slate-200"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Период */}
      <div className="flex gap-1.5">
        {PERIOD_OPTS.map(({ value, label }) => (
          <button key={value} onClick={() => onPeriod(value)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-colors
              ${period === value
                ? "bg-surface-600 text-slate-100"
                : "bg-surface-800 text-slate-500 hover:text-slate-300"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Счётчик */}
      {filteredCount !== totalCount && (
        <p className="text-xs text-slate-500">
          Показано {filteredCount} из {totalCount}
        </p>
      )}
    </div>
  );
}

/** Применить фильтры к массиву заправок. */
export function applyFilters(
  refuels: LocalRefuel[],
  fuelType: FuelTypeFilter,
  period: PeriodFilter,
): LocalRefuel[] {
  let result = refuels;

  if (fuelType !== "all") {
    result = result.filter(r => r.fuelType === fuelType);
  }

  if (period !== "all") {
    const days = period === "30d" ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    result = result.filter(r => new Date(r.createdAt) >= cutoff);
  }

  return result;
}
