"use client";
import { useEffect, useState } from "react";
import { getAllRefuels, type LocalRefuel } from "@/lib/db";
import { formatCurrency, formatNumber, formatOdometer } from "@/lib/calculations";
import { HistorySkeleton } from "@/components/Skeleton";
import { HistoryFilters, applyFilters, type FuelTypeFilter, type PeriodFilter } from "@/components/HistoryFilters";

export default function HistoryPage() {
  const [refuels, setRefuels] = useState<LocalRefuel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fuelType, setFuelType] = useState<FuelTypeFilter>("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefuels(await getAllRefuels());
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  // Pull-to-refresh
  useEffect(() => {
    let startY = 0;
    const onStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onEnd   = (e: TouchEvent) => {
      if (e.changedTouches[0].clientY - startY > 80 && window.scrollY === 0 && !refreshing) {
        setRefreshing(true);
        load();
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend",   onEnd,   { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend",   onEnd);
    };
  }, [refreshing]);

  if (loading) return <HistorySkeleton />;

  if (refuels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
        <div className="text-5xl">📋</div>
        <h2 className="text-xl font-bold text-slate-100">Пока нет заправок</h2>
        <a href="/add" className="btn-primary max-w-xs block text-center no-underline">
          + Записать заправку
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="pt-4 pb-2">
        <h1 className="text-xl font-bold text-slate-100">📋 История</h1>
        {refreshing && <p className="text-xs text-slate-500 mt-1">🔄 Обновление...</p>}
      </div>

      <HistoryFilters
        fuelType={fuelType} period={period}
        onFuelType={setFuelType} onPeriod={setPeriod}
        totalCount={refuels.length}
        filteredCount={applyFilters(refuels, fuelType, period).length}
      />

      <div className="space-y-3">
        {applyFilters(refuels, fuelType, period).map((r) => (
          <RefuelCard
            key={r.localId}
            refuel={r}
            isEditing={editingId === r.localId}
            onEdit={() => setEditingId(r.localId)}
            onClose={() => setEditingId(null)}
            onSaved={load}
            onDeleted={load}
          />
        ))}
      </div>
    </div>
  );
}

function RefuelCard({
  refuel: r, isEditing, onEdit, onClose, onSaved, onDeleted,
}: {
  refuel: LocalRefuel;
  isEditing: boolean;
  onEdit: () => void;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const date = new Date(r.createdAt);
  const [editOdo,   setEditOdo]   = useState(String(r.odometer));
  const [editCost,  setEditCost]  = useState(String(r.totalCost));
  const [editPrice, setEditPrice] = useState(String(r.fuelPrice));
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  // ── Сохранить изменения ──────────────────────────────────────────────
  const handleSave = async () => {
    if (!r.serverId) { onClose(); return; }
    setSaving(true);
    try {
      const { api } = await import("@/lib/api");
      await api.updateRefuel(r.serverId, {
        odometer:   +editOdo,
        fuel_price: +editPrice,
        total_cost: +editCost,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Удалить запись ───────────────────────────────────────────────────
  const handleDelete = async () => {
    const label = date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    if (!confirm(`Удалить заправку от ${label} (${formatCurrency(r.totalCost)})?`)) return;

    setDeleting(true);
    try {
      const [{ api }, { deleteLocalRefuel }] = await Promise.all([
        import("@/lib/api"),
        import("@/lib/db"),
      ]);
      // Удаляем с сервера только если запись уже синхронизирована
      if (r.serverId) await api.deleteRefuel(r.serverId);
      // Всегда удаляем из локальной IndexedDB
      await deleteLocalRefuel(r.localId);
      onDeleted();
    } catch (e: any) {
      alert(e.message);
      setDeleting(false);
    }
  };

  return (
    <div className={`card transition-opacity ${deleting ? "opacity-40 pointer-events-none" : ""}`}>

      {/* ── Заголовок карточки ─────────────────────────────────────── */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-slate-100">
            {date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-400">{formatOdometer(r.odometer)} км</p>
            {r.fuelType && (
              <span className="text-xs bg-brand-500/20 text-brand-500 px-1.5 py-0.5 rounded">
                {r.fuelType}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <p className="font-bold text-brand-500">{formatCurrency(r.totalCost)}</p>
          {!r.isSynced && <span className="text-xs text-yellow-500">⏳</span>}

          {/* Кнопка редактировать / закрыть */}
          <button
            onClick={isEditing ? onClose : onEdit}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors
                       px-2 py-1 border border-surface-700 rounded-lg"
          >
            {isEditing ? "✕" : "✏️"}
          </button>

          {/* Кнопка удалить */}
          {!isEditing && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors
                         px-2 py-1 border border-surface-700 hover:border-red-400/50
                         rounded-lg disabled:opacity-40"
              title="Удалить заправку"
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {/* ── Форма редактирования ───────────────────────────────────── */}
      {isEditing && (
        <div className="mb-3 p-3 bg-surface-700/50 rounded-xl space-y-2 border border-surface-600">
          <p className="text-xs text-slate-400 mb-2">Редактировать</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label text-xs">Пробег</label>
              <input type="number" value={editOdo}
                onChange={e => setEditOdo(e.target.value)}
                className="input-field py-2 text-sm" />
            </div>
            <div>
              <label className="label text-xs">Цена/л</label>
              <input type="number" value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
                className="input-field py-2 text-sm" />
            </div>
            <div>
              <label className="label text-xs">Сумма</label>
              <input type="number" value={editCost}
                onChange={e => setEditCost(e.target.value)}
                className="input-field py-2 text-sm" />
            </div>
          </div>
          {r.serverId ? (
            <button onClick={handleSave} disabled={saving}
              className="w-full bg-brand-500 text-white text-sm py-2 rounded-xl disabled:opacity-50">
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          ) : (
            <p className="text-xs text-yellow-500 text-center">
              Запись ещё не синхронизирована — редактирование доступно после sync
            </p>
          )}
        </div>
      )}

      {/* ── Показатели ────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 text-center pt-3 border-t border-surface-700">
        <Metric label="Литров" value={`${formatNumber(r.liters)} л`} />
        <Metric label="Пробег" value={r.distance ? `${r.distance.toLocaleString("ru-RU")} км` : "—"} />
        <Metric label="л/100"  value={r.consumption ? formatNumber(r.consumption) : "—"} highlight={!!r.consumption} />
        <Metric label="₽/км"   value={r.costPerKm ? formatNumber(r.costPerKm) : "—"} />
      </div>

      {r.notes && (
        <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-surface-700">
          💬 {r.notes}
        </p>
      )}
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className={`text-sm font-semibold ${highlight ? "text-brand-500" : "text-slate-100"}`}>
        {value}
      </p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
