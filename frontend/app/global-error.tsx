"use client";
/**
 * Global error boundary — ловит ошибки в корневом layout.
 * Включает собственный <html> и <body> так как root layout недоступен.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "system-ui, sans-serif",
                     display: "flex", alignItems: "center", justifyContent: "center",
                     minHeight: "100vh", flexDirection: "column", gap: "16px", textAlign: "center",
                     padding: "24px" }}>
        <div style={{ fontSize: "48px" }}>⛽</div>
        <h1 style={{ fontSize: "20px", fontWeight: 600 }}>FuelTracker — критическая ошибка</h1>
        <p style={{ color: "#94a3b8", fontSize: "14px", maxWidth: "300px" }}>
          {error.message || "Приложение не может загрузиться"}
        </p>
        <button
          onClick={reset}
          style={{ background: "#f97316", color: "#fff", border: "none", padding: "12px 28px",
                   borderRadius: "14px", fontSize: "15px", fontWeight: 600, cursor: "pointer",
                   marginTop: "8px" }}
        >
          Перезагрузить
        </button>
      </body>
    </html>
  );
}
