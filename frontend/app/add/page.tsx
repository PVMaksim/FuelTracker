"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getLastOdometer } from "@/lib/db";
import { saveRefuel } from "@/lib/sync";
import { api, type CarResponse } from "@/lib/api";
import {
  calculateLiters, calculateConsumption, calculateDistance,
  calculateCostPerKm, formatNumber, formatCurrency
} from "@/lib/calculations";
import { getSelectedCarId } from "@/lib/car-store";

type FuelType = "92" | "95" | "98" | "diesel";
const FUEL_TYPES: { value: FuelType; label: string }[] = [
  { value: "92", label: "АИ-92" },
  { value: "95", label: "АИ-95" },
  { value: "98", label: "АИ-98" },
  { value: "diesel", label: "ДТ" },
];

export default function AddRefuelPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [car, setCar] = useState<CarResponse | null>(null);
  const [form, setForm] = useState({ odometer: "", fuelPrice: "", totalCost: "", fuelType: "" as FuelType | "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastOdometer, setLastOdometer] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [ocrOdoLoading, setOcrOdoLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const odoFileRef = useRef<HTMLInputElement>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Live-расчёт
  const liters = form.fuelPrice && form.totalCost
    ? (() => { try { return calculateLiters(+form.totalCost, +form.fuelPrice); } catch { return null; } })()
    : null;
  const distance = form.odometer && lastOdometer ? calculateDistance(+form.odometer, lastOdometer) : null;
  const consumption = liters && distance ? calculateConsumption(liters, distance) : null;
  const costPerKm = +form.totalCost && distance ? calculateCostPerKm(+form.totalCost, distance) : null;

  useEffect(() => {
    (async () => {
      // Загружаем текущую машину
      if (navigator.onLine) {
        try {
          const cars = await api.getCars();
          const carId = getSelectedCarId() ?? cars[0]?.id;
          const activeCar = cars.find(c => c.id === carId) ?? cars[0];
          if (activeCar) {
            setCar(activeCar);
            // Подставляем последний тип топлива для ЭТОЙ машины (не цену!)
            if (activeCar.last_fuel_type) {
              setForm(f => ({ ...f, fuelType: activeCar.last_fuel_type as FuelType }));
            }
          }
        } catch (e: any) {
      alert("OCR не смог распознать чек. Введите данные вручную.");
    }
      }
      // Последний пробег из локальной БД
      const last = await getLastOdometer();
      setLastOdometer(last);
    })();
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    const minOdometer = lastOdometer ?? (car?.initial_odometer ?? 0);
    if (!form.odometer || isNaN(+form.odometer) || +form.odometer <= 0)
      errs.odometer = "Введите корректный пробег";
    else if (+form.odometer <= minOdometer)
      errs.odometer = `Пробег должен быть больше ${minOdometer.toLocaleString("ru-RU")} км`;
    if (!form.fuelPrice || isNaN(+form.fuelPrice) || +form.fuelPrice <= 0)
      errs.fuelPrice = "Введите цену за литр";
    if (!form.totalCost || isNaN(+form.totalCost) || +form.totalCost <= 0)
      errs.totalCost = "Введите сумму заправки";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await saveRefuel({
        odometer: +form.odometer,
        fuelPrice: +form.fuelPrice,
        totalCost: +form.totalCost,
        fuelType: form.fuelType || undefined,
        carId: car?.id,
        notes: form.notes || undefined,
      });
      // Обновить last_fuel_type машины на сервере
      if (car?.id && form.fuelType) {
        api.updateCar(car.id, { last_fuel_type: form.fuelType }).catch(() => {});
      }
      setSaved(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (e: any) {
      setErrors({ odometer: e.message });
    } finally { setSaving(false); }
  };

  const handleOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const result = await api.analyzeReceipt(file);
      if (!result.total_cost && !result.liters && !result.price_per_liter) {
        alert("OCR не смог распознать чек. Введите данные вручную.");
      } else {
        setForm(f => ({
          ...f,
          totalCost: result.total_cost ? String(result.total_cost) : f.totalCost,
          fuelPrice: result.price_per_liter ? String(result.price_per_liter) : f.fuelPrice,
        }));
      }
    } catch (e: any) {
      alert("OCR не смог распознать чек. Введите данные вручную.");
    }
    setOcrLoading(false);
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      alert("Геолокация не поддерживается браузером");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ru`,
            { headers: { "User-Agent": "FuelTracker/1.0" } }
          );
          const data = await resp.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.municipality || addr.village || addr.state_district || "";
          const road = addr.road ? `, ${addr.road}` : "";
          if (city) {
            setForm(f => ({ ...f, notes: f.notes ? f.notes : `${city}${road}` }));
          } else {
            alert("Не удалось определить город");
          }
        } catch {
          alert("Ошибка при определении местоположения");
        }
        setLocLoading(false);
      },
      () => {
        alert("Нет доступа к геолокации. Разреши в настройках браузера.");
        setLocLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleOcrOdometer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrOdoLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api/v1"}/ocr/odometer`, {
        method: "POST",
        headers: { "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "" },
        body: (() => { const f = new FormData(); f.append("file", file); return f; })(),
      });
      const result = await resp.json();
      if (result.odometer) {
        setForm(f => ({ ...f, odometer: String(result.odometer) }));
      } else {
        alert("Не удалось распознать пробег. Введите вручную.");
      }
    } catch {
      alert("Ошибка при распознавании пробега.");
    }
    setOcrOdoLoading(false);
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold text-slate-100">Сохранено!</h2>
        {liters && (
          <p className="text-slate-400">
            {formatNumber(liters)} л
            {consumption ? ` · ${formatNumber(consumption)} л/100км` : ""}
            {costPerKm ? ` · ${formatNumber(costPerKm)} ₽/км` : ""}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 max-w-md mx-auto">
      <div className="pt-4">
        <h1 className="text-xl font-bold text-slate-100">⛽ Новая заправка</h1>
        <p className="text-sm text-slate-400 mt-1">
          {car ? car.name : "—"}
          {lastOdometer ? ` · последний пробег: ${lastOdometer.toLocaleString("ru-RU")} км` : ""}
        </p>
      </div>

      {/* OCR */}
      <button onClick={() => fileRef.current?.click()} disabled={ocrLoading}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
                   border-2 border-dashed border-brand-500/50 text-brand-500
                   hover:border-brand-500 hover:bg-brand-500/10 transition-colors disabled:opacity-50">
        {ocrLoading ? <><span className="animate-spin">⏳</span> Распознаём чек...</> : <><span>📷</span> Сфотографировать чек</>}
      </button>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleOcr} className="hidden" />

      {/* Тип топлива */}
      <div>
        <label className="label">Тип топлива</label>
        <div className="grid grid-cols-4 gap-2">
          {FUEL_TYPES.map(({ value, label }) => (
            <button key={value}
              onClick={() => setForm(f => ({ ...f, fuelType: f.fuelType === value ? "" : value }))}
              className={`py-2.5 rounded-xl text-sm font-medium transition-colors
                ${form.fuelType === value ? "bg-brand-500 text-white" : "bg-surface-700 text-slate-300 hover:bg-surface-600"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Поля */}
      <div className="space-y-4">
        <div>
          <label className="label">Текущий пробег (км) *</label>
          <div className="flex gap-2">
            <input type="number" inputMode="numeric"
              placeholder={lastOdometer ? String(lastOdometer + 1) : "78701"}
              value={form.odometer} onChange={set("odometer")}
              className={`input-field flex-1 ${errors.odometer ? "error" : ""}`} />
            <button type="button" onClick={() => odoFileRef.current?.click()}
              disabled={ocrOdoLoading}
              className="bg-surface-700 hover:bg-surface-600 text-slate-300 px-3 rounded-xl
                         border border-surface-600 transition-colors disabled:opacity-50 flex-shrink-0"
              title="Сфотографировать одометр">
              {ocrOdoLoading ? "⏳" : "📷"}
            </button>
          </div>
          <input ref={odoFileRef} type="file" accept="image/*" capture="environment"
                 onChange={handleOcrOdometer} className="hidden" />
          {errors.odometer && <p className="text-red-400 text-sm mt-1">{errors.odometer}</p>}
        </div>
        <div>
          <label className="label">Цена за литр (₽) *</label>
          <input type="number" inputMode="decimal" placeholder="58.50"
            value={form.fuelPrice} onChange={set("fuelPrice")}
            className={`input-field ${errors.fuelPrice ? "error" : ""}`} />
          {errors.fuelPrice && <p className="text-red-400 text-sm mt-1">{errors.fuelPrice}</p>}
        </div>
        <div>
          <label className="label">Сумма заправки (₽) *</label>
          <input type="number" inputMode="numeric" placeholder="2500"
            value={form.totalCost} onChange={set("totalCost")}
            className={`input-field ${errors.totalCost ? "error" : ""}`} />
          {errors.totalCost && <p className="text-red-400 text-sm mt-1">{errors.totalCost}</p>}
        </div>
        <div>
          <label className="label">Заметка (необязательно)</label>
          <div className="flex gap-2">
            <input type="text" placeholder="Лукойл на Невском"
              value={form.notes} onChange={set("notes")} className="input-field flex-1" />
            <button type="button" onClick={handleGetLocation} disabled={locLoading}
              className="bg-surface-700 hover:bg-surface-600 text-slate-300 px-3 rounded-xl
                         border border-surface-600 transition-colors disabled:opacity-50 flex-shrink-0"
              title="Определить местоположение">
              {locLoading ? "⏳" : "📍"}
            </button>
          </div>
        </div>
      </div>

      {/* Live-расчёт */}
      {liters && (
        <div className="card bg-surface-700/50 border-brand-500/20">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Предварительный расчёт</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div><p className="font-bold text-brand-500 text-lg">{formatNumber(liters)} л</p><p className="text-xs text-slate-400">Литров</p></div>
            <div><p className="font-bold text-slate-100">{distance ? distance.toLocaleString("ru-RU") : "—"}</p><p className="text-xs text-slate-400">км</p></div>
            <div><p className="font-bold text-slate-100">{consumption ? formatNumber(consumption) : "—"}</p><p className="text-xs text-slate-400">л/100км</p></div>
            <div><p className="font-bold text-slate-100">{costPerKm ? formatNumber(costPerKm) : "—"}</p><p className="text-xs text-slate-400">₽/км</p></div>
          </div>
        </div>
      )}

      <button onClick={handleSubmit} disabled={saving} className="btn-primary">
        {saving ? "Сохранение..." : "Сохранить заправку"}
      </button>
      <a href="/" className="btn-secondary block text-center no-underline">Отмена</a>
    </div>
  );
}
