"use client";
import { useEffect, useState } from "react";
import { api, type StatsResponse, type CarResponse } from "@/lib/api";
import { getAllRefuels, type LocalRefuel } from "@/lib/db";
import { formatCurrency, formatNumber, formatOdometer } from "@/lib/calculations";
import { DashboardSkeleton } from "@/components/Skeleton";
import { getSelectedCarId } from "@/lib/car-store";

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [car, setCar] = useState<CarResponse | null>(null);
  const [lastRefuel, setLastRefuel] = useState<LocalRefuel | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noCar, setNoCar] = useState(false);

  const load = async () => {
    const local = await getAllRefuels();
    if (local.length > 0) setLastRefuel(local[0]);

    if (navigator.onLine) {
      try {
        const cars = await api.getCars();
        if (cars.length === 0) { setNoCar(true); setLoading(false); setRefreshing(false); return; }
        const carId = getSelectedCarId() ?? cars[0].id;
        const activeCar = cars.find(c => c.id === carId) ?? cars[0];
        setCar(activeCar);
        const s = await api.getStats(activeCar.id);
        setStats(s);
      } catch {}
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let startY = 0;
    const onStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onEnd = (e: TouchEvent) => {
      if (e.changedTouches[0].clientY - startY > 80 && window.scrollY === 0 && !refreshing) {
        setRefreshing(true); load();
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => { window.removeEventListener("touchstart", onStart); window.removeEventListener("touchend", onEnd); };
  }, [refreshing]);

  if (loading) return <DashboardSkeleton />;

  if (noCar) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
        <div className="text-5xl">🚗</div>
        <h2 className="text-xl font-bold text-slate-100">Добавь первый автомобиль</h2>
        <p className="text-slate-400 text-sm">Без машины нельзя вести учёт заправок</p>
        <a href="/cars" className="btn-primary max-w-xs block text-center no-underline">
          + Добавить машину
        </a>
      </div>
    );
  }

  const lastOdometer = stats?.last_odometer ?? lastRefuel?.odometer ?? 78700;

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {refreshing && <div className="text-center text-xs text-slate-400 py-1">🔄 Обновление...</div>}

      <div className="pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">⛽ FuelTracker</h1>
            <p className="text-slate-400 text-sm">{car?.name ?? "Загрузка..."}</p>
          </div>
          <a href="/cars"
            className="text-xs text-slate-400 hover:text-slate-200 border border-surface-700
                       px-3 py-1.5 rounded-xl transition-colors no-underline">
            🚗 Машины
          </a>
        </div>
      </div>

      <div className="card bg-gradient-to-br from-brand-500/20 to-surface-800 border-brand-500/30">
        <p className="stat-label">Текущий пробег</p>
        <p className="text-3xl font-bold text-brand-500">
          {formatOdometer(lastOdometer)} <span className="text-lg text-slate-400">км</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card">
          <p className="stat-label">Ср. расход</p>
          <p className="stat-value">
            {stats?.avg_consumption ? `${formatNumber(stats.avg_consumption)}` : "—"}
            <span className="text-sm text-slate-400"> л/100</span>
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">За 30 дней</p>
          <p className="stat-value">
            {stats?.avg_consumption_30d ? `${formatNumber(stats.avg_consumption_30d)}` : "—"}
            <span className="text-sm text-slate-400"> л/100</span>
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Заправок</p>
          <p className="stat-value">{stats?.total_refuels ?? "—"}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Потрачено</p>
          <p className="stat-value text-lg">
            {stats ? formatCurrency(stats.total_cost) : "—"}
          </p>
        </div>
      </div>

      {lastRefuel && (
        <div className="card">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Последняя заправка</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Metric label="Литров" value={`${formatNumber(lastRefuel.liters)} л`} />
            <Metric label="Сумма" value={formatCurrency(lastRefuel.totalCost)} />
            <Metric label="л/100" value={lastRefuel.consumption ? formatNumber(lastRefuel.consumption) : "—"} accent={!!lastRefuel.consumption} />
            <Metric label="₽/км" value={lastRefuel.costPerKm ? formatNumber(lastRefuel.costPerKm) : "—"} />
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            {new Date(lastRefuel.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            {" · "}{formatOdometer(lastRefuel.odometer)} км
            {lastRefuel.fuelType && <span className="ml-2 text-brand-500">· {lastRefuel.fuelType}</span>}
          </p>
        </div>
      )}

      <a href="/add" className="btn-primary block text-center no-underline">+ Записать заправку</a>

      <div className="flex gap-3">
        <a href={api.exportCsv(car?.id)}
          className="flex-1 text-center text-sm text-slate-400 hover:text-slate-200 py-2 border border-surface-700 rounded-xl transition-colors">↓ CSV</a>
        <a href={api.exportXlsx(car?.id)}
          className="flex-1 text-center text-sm text-slate-400 hover:text-slate-200 py-2 border border-surface-700 rounded-xl transition-colors">↓ Excel</a>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className={`text-sm font-semibold ${accent ? "text-brand-500" : "text-slate-100"}`}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
