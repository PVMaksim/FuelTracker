"use client";
/**
 * SyncProvider — context for online/offline status and background sync.
 * Провайдер синхронизации: отслеживает сеть, синхронизирует при восстановлении.
 */
import { createContext, useContext, useEffect, useState } from "react";
import { syncPendingRefuels } from "@/lib/sync";

type SyncStatus = "online" | "offline" | "syncing";

const SyncContext = createContext<SyncStatus>("online");

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>("online");

  useEffect(() => {
    // Установить начальный статус
    setStatus(navigator.onLine ? "online" : "offline");

    const handleOnline = async () => {
      setStatus("syncing");
      const synced = await syncPendingRefuels();
      if (synced > 0) {
        console.log(`[sync] Синхронизировано ${synced} записей`);
      }
      setStatus("online");
    };

    const handleOffline = () => setStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <SyncContext.Provider value={status}>
      {children}
      <SyncIndicator status={status} />
    </SyncContext.Provider>
  );
}

export function useSyncStatus() {
  return useContext(SyncContext);
}

function SyncIndicator({ status }: { status: SyncStatus }) {
  if (status === "online") return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 text-center text-xs py-1 font-medium z-50
        ${status === "offline" ? "bg-red-600 text-white" : "bg-yellow-500 text-black"}`}
    >
      {status === "offline" ? "🔴 Офлайн — данные сохраняются локально" : "🔄 Синхронизация..."}
    </div>
  );
}
