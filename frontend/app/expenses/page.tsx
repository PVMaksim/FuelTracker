"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getSelectedCarId } from "@/lib/car-store";
import { formatCurrency } from "@/lib/calculations";

type FilterType = "all" | "parts" | "labor";
type Category = "repair" | "other";

interface Expense {
  id: string;
  car_id: string | null;
  created_at: string;
  amount: number;
  category: string;
  description: string | null;
  is_part: boolean;
}

interface RepairItem {
  description: string;
  amount: number;
  is_part: boolean;
  selected: boolean;
}

export default function ExpensesPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const repairFileRef = useRef<HTMLInputElement>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<{ total: number; total_parts: number; total_labor: number; total_other: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [carId, setCarId] = useState<string | undefined>();
  const [filter, setFilter] = useState<FilterType>("all");

  // Форма одиночного расхода
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [description, setDescription] = useState("");
  const [isPart, setIsPart] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Мультипозиционный OCR (ремонт)
  const [repairItems, setRepairItems] = useState<RepairItem[]>([]);
  const [repairOcrLoading, setRepairOcrLoading] = useState(false);
  const [savingRepair, setSavingRepair] = useState(false);

  const load = async (cid?: string, f?: FilterType) => {
    try {
      const apiFilter = f === "all" ? undefined : f;
      const [exp, st] = await Promise.all([
        api.getExpenses(cid, apiFilter),
        api.getExpenseStats(cid),
      ]);
      setExpenses(exp);
      setStats(st);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    const cid = getSelectedCarId() || undefined;
    setCarId(cid);
    load(cid, "all");
  }, []);

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    load(carId, f);
  };

  const handleAdd = async () => {
    if (!amount || +amount <= 0) return alert("Введите сумму");
    setSaving(true);
    try {
      await api.createExpense({
        amount: +amount, category, car_id: carId,
        description: description || undefined, is_part: isPart,
      });
      setAmount(""); setDescription(""); setIsPart(false);
      await load(carId, filter);
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string, amt: number) => {
    if (!confirm(`Удалить расход ${formatCurrency(amt)}?`)) return;
    try { await api.deleteExpense(id); await load(carId, filter); }
    catch (e: any) { alert(e.message); }
  };

  const handleOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const result = await api.analyzeReceipt(file);
      if (result.total_cost) setAmount(String(result.total_cost));
      else alert("Не удалось распознать сумму");
    } catch { alert("Ошибка OCR"); }
    setOcrLoading(false);
  };

  const handleRepairOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRepairOcrLoading(true);
    try {
      const result = await api.analyzeRepairReceipt(file);
      if (result.items && result.items.length > 0) {
        setRepairItems(result.items.map((item: { description: string; amount: number; is_part: boolean }) => ({ ...item, selected: true })));
      } else {
        alert("Позиции не распознаны. Попробуйте ещё раз.");
      }
    } catch { alert("Ошибка OCR"); }
    setRepairOcrLoading(false);
  };

  const handleSaveRepairItems = async () => {
    const selected = repairItems.filter(i => i.selected);
    if (selected.length === 0) return alert("Выберите хотя бы одну позицию");
    setSavingRepair(true);
    try {
      await api.bulkCreateExpenses({
        car_id: carId,
        items: selected.map(i => ({
          amount: i.amount, category: "repair",
          description: i.description, is_part: i.is_part,
        })),
      });
      setRepairItems([]);
      await load(carId, filter);
    } catch (e: any) { alert(e.message); }
    setSavingRepair(false);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="pt-4 pb-4">
        <h1 className="text-xl font-bold text-slate-100">💸 Расходы</h1>
        {stats && (
          <p className="text-sm text-slate-400">
            Всего: {formatCurrency(stats.total)}
            {stats.total_parts > 0 && ` · Запчасти: ${formatCurrency(stats.total_parts)}`}
            {stats.total_labor > 0 && ` · Работы: ${formatCurrency(stats.total_labor)}`}
          </p>
        )}
      </div>

      {/* OCR чека ремонта */}
      <div className="card mb-4">
        <p className="text-sm font-medium text-slate-300 mb-3">🔧 Добавить из чека ремонта</p>
        <button onClick={() => repairFileRef.current?.click()} disabled={repairOcrLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                     border-2 border-dashed border-brand-500/50 text-brand-500
                     hover:border-brand-500 hover:bg-brand-500/10 transition-colors disabled:opacity-50">
          {repairOcrLoading
            ? <><span className="animate-spin">⏳</span> Распознаём...</>
            : <><span>📷</span> Сфотографировать чек ремонта</>}
        </button>
        <input ref={repairFileRef} type="file" accept="image/*" capture="environment"
               onChange={handleRepairOcr} className="hidden" />

        {repairItems.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Распознанные позиции — выбери нужные:</p>
            {repairItems.map((item, idx) => (
              <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors
                ${item.selected ? "border-brand-500/50 bg-brand-500/10" : "border-surface-700 bg-surface-800"}`}>
                <input type="checkbox" checked={item.selected}
                  onChange={e => setRepairItems(prev => prev.map((it, i) =>
                    i === idx ? { ...it, selected: e.target.checked } : it))}
                  className="mt-0.5 accent-orange-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{item.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium
                      ${item.is_part ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>
                      {item.is_part ? "🔩 Запчасть" : "🔨 Работа"}
                    </span>
                    <span className="text-sm font-bold text-slate-100">{formatCurrency(item.amount)}</span>
                  </div>
                </div>
                <button onClick={() => setRepairItems(prev => prev.map((it, i) =>
                  i === idx ? { ...it, is_part: !it.is_part } : it))}
                  className="text-xs text-slate-500 hover:text-slate-300 border border-surface-600 rounded px-1.5 py-0.5"
                  title="Переключить тип">
                  ⇄
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <p className="text-sm text-slate-400">
                Итого: {formatCurrency(repairItems.filter(i => i.selected).reduce((s, i) => s + i.amount, 0))}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setRepairItems([])}
                  className="text-sm text-slate-500 hover:text-slate-300 px-3 py-1.5 border border-surface-700 rounded-xl">
                  Отмена
                </button>
                <button onClick={handleSaveRepairItems} disabled={savingRepair}
                  className="text-sm bg-brand-500 text-white px-3 py-1.5 rounded-xl disabled:opacity-50">
                  {savingRepair ? "Сохранение..." : `Сохранить (${repairItems.filter(i => i.selected).length})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Форма одиночного расхода */}
      <div className="card mb-4 space-y-3">
        <p className="text-sm font-medium text-slate-300">+ Добавить вручную</p>
        <div className="flex gap-2">
          {(["repair", "other"] as Category[]).map(cat => (
            <button key={cat} onClick={() => { setCategory(cat); if (cat === "other") setIsPart(false); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${category === cat ? "bg-brand-500 text-white" : "bg-surface-700 text-slate-400 hover:bg-surface-600"}`}>
              {cat === "repair" ? "🔧 Ремонт" : "📦 Прочее"}
            </button>
          ))}
        </div>

        {category === "repair" && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPart} onChange={e => setIsPart(e.target.checked)}
              className="accent-orange-500" />
            <span className="text-sm text-slate-300">Это запчасть (не работа)</span>
          </label>
        )}

        <div>
          <label className="label">Сумма (₽) *</label>
          <div className="flex gap-2">
            <input type="number" inputMode="numeric" placeholder="1500"
              value={amount} onChange={e => setAmount(e.target.value)} className="input-field flex-1" />
            <button onClick={() => fileRef.current?.click()} disabled={ocrLoading}
              className="bg-surface-700 hover:bg-surface-600 text-slate-300 px-3 rounded-xl
                         border border-surface-600 transition-colors disabled:opacity-50">
              {ocrLoading ? "⏳" : "📷"}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment"
                 onChange={handleOcr} className="hidden" />
        </div>

        <div>
          <label className="label">Описание</label>
          <input type="text" placeholder="Замена масла, фильтров..."
            value={description} onChange={e => setDescription(e.target.value)} className="input-field" />
        </div>

        <button onClick={handleAdd} disabled={saving || !amount} className="btn-primary disabled:opacity-50">
          {saving ? "Сохранение..." : "Добавить"}
        </button>
      </div>

      {/* Фильтр */}
      <div className="flex gap-2 mb-3">
        {(["all", "parts", "labor"] as FilterType[]).map(f => (
          <button key={f} onClick={() => handleFilterChange(f)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors
              ${filter === f ? "bg-surface-600 text-slate-100" : "bg-surface-800 text-slate-500 hover:text-slate-300"}`}>
            {f === "all" ? "Все" : f === "parts" ? "🔩 Запчасти" : "🔨 Работы"}
          </button>
        ))}
      </div>

      {/* Список */}
      {loading ? (
        <p className="text-slate-400 text-sm text-center py-4">Загрузка...</p>
      ) : expenses.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-4">Нет записей</p>
      ) : (
        <div className="space-y-2">
          {expenses.map(exp => (
            <div key={exp.id} className="card flex items-center justify-between gap-3">
              <div className="text-xl">
                {exp.category === "repair" ? (exp.is_part ? "🔩" : "🔨") : "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium
                    ${exp.category === "repair"
                      ? exp.is_part ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
                      : "bg-surface-600 text-slate-400"}`}>
                    {exp.category === "repair" ? (exp.is_part ? "Запчасть" : "Работа") : "Прочее"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(exp.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                  </span>
                </div>
                {exp.description && (
                  <p className="text-sm text-slate-300 truncate mt-0.5">{exp.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-bold text-slate-100">{formatCurrency(exp.amount)}</span>
                <button onClick={() => handleDelete(exp.id, exp.amount)}
                  className="text-slate-500 hover:text-red-400 transition-colors text-sm px-1.5 py-1
                             border border-surface-700 hover:border-red-400/50 rounded-lg">
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
