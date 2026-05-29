"use client";
/**
 * Next.js App Router error boundary — перехватывает ошибки рендера на любой странице.
 * Показывает понятный экран вместо белой страницы.
 */
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логируем в консоль — в проде можно добавить Sentry
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-5 p-6 text-center">
      <div className="text-5xl">⚠️</div>
      <h2 className="text-xl font-bold text-slate-100">Что-то пошло не так</h2>
      <p className="text-slate-400 text-sm max-w-xs">
        {error.message || "Произошла неожиданная ошибка"}
      </p>
      {error.digest && (
        <p className="text-xs text-slate-600 font-mono">#{error.digest}</p>
      )}
      <div className="flex gap-3 mt-2">
        <button onClick={reset} className="btn-primary max-w-[160px]">
          Попробовать снова
        </button>
        <a href="/" className="btn-secondary max-w-[160px] block text-center no-underline">
          На главную
        </a>
      </div>
    </div>
  );
}
