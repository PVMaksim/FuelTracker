"use client";
/**
 * Cars management page — добавление, переименование, удаление машин.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type CarResponse } from "@/lib/api";
import { getSelectedCarId, setSelectedCarId, clearSelectedCarId } from "@/lib/car-store";

export default function CarsPage() {
  const router = useRouter();
  const [cars, setCars] = useState<CarResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newOdo, setNewOdo] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = async () => {
    try {
      const data = await api.getCars();
      setCars(data);
      // Если машин нет — предложить создать
      const sid = getSelectedCarId();
      if (sid && data.find(c => c.id === sid)) {
        setSelectedId(sid);
      } else if (data.length > 0) {
        setSelectedId(data[0].id);
        setSelectedCarId(data[0].id);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const car = await api.createCar({
        name: newName.trim(),
        initial_odometer: +newOdo || 0,
      });
      setNewName("");
      setNewOdo("");
      setSelectedCarId(car.id);
      setSelectedId(car.id);
      await load();
    } catch (e: any) { alert(e.message); }
    setAdding(false);
  };

  const handleSelect = (id: string) => {
    setSelectedCarId(id);
    setSelectedId(id);
    router.push("/");
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await api.updateCar(id, { name: editName.trim() });
      setEditingId(null);
      await load();
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (car: CarResponse) => {
    if (!confirm(`Удалить «${car.name}»? Все заправки этой машины будут удалены.`)) return;
    try {
      await api.deleteCar(car.id);
      if (selectedId === car.id) {
        clearSelectedCarId();
        setSelectedId(null);
      }
      await load();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="pt-4 pb-4">
        <h1 className="text-xl font-bold text-slate-100">🚗 Автомобили</h1>
        <p className="text-sm text-slate-400">Выбери активную машину или добавь новую</p>
      </div>

      {/* Список машин */}
      {loading ? (
        <p className="text-slate-400 text-sm">Загрузка...</p>
      ) : (
        <div className="space-y-3 mb-6">
          {cars.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">
              Нет машин — добавь первую ниже
            </p>
          )}
          {cars.map(car => (
            <div key={car.id}
              className={`card border-2 transition-colors ${
                selectedId === car.id ? "border-brand-500" : "border-surface-700"
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {editingId === car.id ? (
                    <div className="flex gap-2">
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleRename(car.id)}
                        className="input-field py-1.5 text-sm flex-1"
                        autoFocus
                      />
                      <button onClick={() => handleRename(car.id)}
                        className="bg-brand-500 text-white px-3 py-1.5 rounded-lg text-sm">
                        ✓
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="bg-surface-700 text-slate-400 px-3 py-1.5 rounded-lg text-sm">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-100">{car.name}</p>
                        {selectedId === car.id && (
                          <span className="text-xs bg-brand-500/20 text-brand-500 px-1.5 py-0.5 rounded">
                            активна
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Нач. пробег: {car.initial_odometer.toLocaleString("ru-RU")} км
                        {car.last_fuel_type && ` · ${car.last_fuel_type}`}
                      </p>
                    </div>
                  )}
                </div>

                {editingId !== car.id && (
                  <div className="flex gap-1.5 ml-3">
                    {selectedId !== car.id && (
                      <button onClick={() => handleSelect(car.id)}
                        className="text-xs bg-brand-500 text-white px-2.5 py-1.5 rounded-lg">
                        Выбрать
                      </button>
                    )}
                    <button onClick={() => { setEditingId(car.id); setEditName(car.name); }}
                      className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5
                                 border border-surface-700 rounded-lg">
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(car)}
                      className="text-xs text-slate-400 hover:text-red-400 px-2 py-1.5
                                 border border-surface-700 hover:border-red-400/50 rounded-lg">
                      🗑
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Добавить новую машину */}
      <div className="card space-y-3">
        <p className="text-sm font-medium text-slate-300">Добавить автомобиль</p>
        <div>
          <label className="label">Название *</label>
          <input type="text" placeholder="Например: Toyota Fielder"
            value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            className="input-field" />
        </div>
        <div>
          <label className="label">Начальный пробег (км)</label>
          <input type="number" inputMode="numeric" placeholder="78700"
            value={newOdo} onChange={e => setNewOdo(e.target.value)}
            className="input-field" />
          <p className="text-xs text-slate-500 mt-1">
            Текущий пробег на спидометре — нужен для расчёта первого расхода
          </p>
        </div>
        <button onClick={handleAdd} disabled={adding || !newName.trim()}
          className="btn-primary disabled:opacity-50">
          {adding ? "Добавление..." : "+ Добавить машину"}
        </button>
      </div>

      <a href="/" className="btn-secondary block text-center no-underline mt-4">
        ← Назад
      </a>
    </div>
  );
}
