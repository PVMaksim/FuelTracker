/**
 * 404 Not Found page — автоматически используется Next.js App Router.
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-5 p-6 text-center">
      <div className="text-5xl">🔍</div>
      <h2 className="text-xl font-bold text-slate-100">Страница не найдена</h2>
      <p className="text-slate-400 text-sm">
        Такой страницы не существует. Возможно, ссылка устарела.
      </p>
      <a href="/" className="btn-primary max-w-xs block text-center no-underline">
        На главную
      </a>
    </div>
  );
}
