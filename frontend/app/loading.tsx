"use client";
/**
 * Route transition loading indicator.
 * Next.js автоматически показывает этот компонент при переходе между страницами.
 */

export default function Loading() {
  return (
    <>
      {/* Тонкая оранжевая полоска сверху */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-brand-500"
        style={{ animation: "progress 1.5s ease-in-out infinite" }}
      />
      <style>{`
        @keyframes progress {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </>
  );
}
