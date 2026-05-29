"use client";
import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { api, type StatsResponse } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/calculations";
import { StatsSkeleton } from "@/components/Skeleton";

type Tab = "consumption" | "monthly";

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("consumption");

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch(() => setError("Нет подключения к серверу"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <StatsSkeleton />;

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 p-4 text-center">
        <div className="text-4xl">📡</div>
        <p className="text-slate-400">{error ?? "Нет данных"}</p>
        <p className="text-slate-500 text-sm">Статистика доступна только онлайн</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <div className="pt-4">
        <h1 className="text-xl font-bold text-slate-100">📊 Статистика</h1>
      </div>

      {/* Ключевые метрики */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Ср. расход (всё время)" value={`${formatNumber(stats.avg_consumption)} л/100`} accent />
        <StatCard label="Ср. расход (30 дней)"   value={`${formatNumber(stats.avg_consumption_30d)} л/100`} />
        <StatCard label="Заправок"               value={String(stats.total_refuels)} />
        <StatCard label="Всего литров"            value={`${formatNumber(stats.total_liters, 0)} л`} />
        <StatCard label="Потрачено всего"         value={formatCurrency(stats.total_cost)} wide />
      </div>

      {/* Переключатель графиков */}
      {(stats.chart_data.length > 1 || stats.monthly_data.length > 0) && (
        <div className="card">
          {/* Табы */}
          <div className="flex gap-2 mb-4">
            <TabBtn active={tab === "consumption"} onClick={() => setTab("consumption")}>
              Расход л/100
            </TabBtn>
            <TabBtn active={tab === "monthly"} onClick={() => setTab("monthly")}>
              По месяцам
            </TabBtn>
          </div>

          {tab === "consumption" && stats.chart_data.length > 1 && (
            <>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-4">
                Расход топлива (л/100км)
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.chart_data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }}
                         tickFormatter={(v) => v.slice(0, 5)} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12 }}
                    labelStyle={{ color: "#94a3b8" }}
                    formatter={(v: number) => [`${v} л/100км`, "Расход"]}
                  />
                  {stats.avg_consumption && (
                    <ReferenceLine y={stats.avg_consumption} stroke="#f97316" strokeDasharray="4 4"
                      label={{ value: "Ср.", fill: "#f97316", fontSize: 10 }} />
                  )}
                  <Line type="monotone" dataKey="consumption" stroke="#f97316" strokeWidth={2}
                        dot={{ fill: "#f97316", r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}

          {tab === "monthly" && stats.monthly_data.length > 0 && (
            <>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-4">
                Расходы по месяцам (₽)
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.monthly_data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }}
                         tickFormatter={(v) => v.slice(5)} /> {/* Только месяц */}
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12 }}
                    labelStyle={{ color: "#94a3b8" }}
                    formatter={(v: number, name: string) => [
                      name === "total_cost" ? formatCurrency(v) : `${formatNumber(v, 0)} л`,
                      name === "total_cost" ? "Потрачено" : "Литров",
                    ]}
                  />
                  <Bar dataKey="total_cost" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {/* Таблица по месяцам */}
              <div className="mt-4 space-y-1">
                {[...stats.monthly_data].reverse().slice(0, 6).map(m => (
                  <div key={m.month} className="flex justify-between text-xs py-1.5
                       border-b border-surface-700 last:border-0">
                    <span className="text-slate-400">{formatMonth(m.month)}</span>
                    <span className="text-slate-100 font-medium">{formatCurrency(m.total_cost)}</span>
                    <span className="text-slate-400">{formatNumber(m.total_liters, 0)} л</span>
                    <span className="text-brand-500">
                      {m.avg_consumption ? `${formatNumber(m.avg_consumption)} л/100` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Экспорт */}
      <div className="card">
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Экспорт данных</p>
        <div className="flex gap-3">
          <a href={api.exportCsv()}
            className="flex-1 text-center py-3 bg-surface-700 hover:bg-surface-600
                       rounded-xl text-sm text-slate-200 transition-colors no-underline">
            📄 CSV
          </a>
          <a href={api.exportXlsx()}
            className="flex-1 text-center py-3 bg-surface-700 hover:bg-surface-600
                       rounded-xl text-sm text-slate-200 transition-colors no-underline">
            📊 Excel
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, wide }: {
  label: string; value: string; accent?: boolean; wide?: boolean;
}) {
  return (
    <div className={`stat-card ${wide ? "col-span-2" : ""}`}>
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${accent ? "text-brand-500" : ""}`}>{value}</p>
    </div>
  );
}

function TabBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors
        ${active ? "bg-brand-500 text-white" : "bg-surface-700 text-slate-400 hover:text-slate-200"}`}>
      {children}
    </button>
  );
}

function formatMonth(ym: string): string {
  const [year, month] = ym.split("-");
  const months = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  return `${months[+month - 1]} ${year}`;
}
