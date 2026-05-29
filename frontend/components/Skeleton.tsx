"use client";
/**
 * Skeleton loading components — animated placeholders while data loads.
 * Используют animate-pulse из Tailwind.
 */

/** Базовый блок-заглушка. */
export function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-surface-700 rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
}

/** Скелетон для stat-карточки на дашборде. */
export function SkeletonStatCard() {
  return (
    <div className="stat-card">
      <SkeletonBlock className="h-3 w-16 mb-2" />
      <SkeletonBlock className="h-7 w-24" />
    </div>
  );
}

/** Скелетон для карточки заправки в истории. */
export function SkeletonRefuelCard() {
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-1.5">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-3 w-20" />
        </div>
        <SkeletonBlock className="h-5 w-16" />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-surface-700">
        {[0, 1, 2].map((i) => (
          <div key={i} className="text-center space-y-1.5">
            <SkeletonBlock className="h-4 w-14 mx-auto" />
            <SkeletonBlock className="h-3 w-10 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Скелетон дашборда — карточки метрик. */
export function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <div className="pt-4 pb-2">
        <SkeletonBlock className="h-7 w-36 mb-1" />
        <SkeletonBlock className="h-4 w-24" />
      </div>
      {/* Большая карточка пробега */}
      <div className="card">
        <SkeletonBlock className="h-3 w-24 mb-2" />
        <SkeletonBlock className="h-9 w-44" />
      </div>
      {/* 2×2 stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => <SkeletonStatCard key={i} />)}
      </div>
      {/* Последняя заправка */}
      <SkeletonRefuelCard />
    </div>
  );
}

/** Скелетон страницы истории. */
export function HistorySkeleton() {
  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="pt-4 pb-4">
        <SkeletonBlock className="h-6 w-24 mb-1" />
        <SkeletonBlock className="h-4 w-20" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => <SkeletonRefuelCard key={i} />)}
      </div>
    </div>
  );
}

/** Скелетон страницы статистики. */
export function StatsSkeleton() {
  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <div className="pt-4">
        <SkeletonBlock className="h-6 w-32 mb-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      {/* График */}
      <div className="card">
        <SkeletonBlock className="h-3 w-36 mb-4" />
        <SkeletonBlock className="h-[200px] w-full rounded-lg" />
      </div>
    </div>
  );
}
