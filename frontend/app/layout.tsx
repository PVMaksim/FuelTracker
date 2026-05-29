import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import { SyncProvider } from "@/components/SyncProvider";

export const metadata: Metadata = {
  title: "FuelTracker",
  description: "Трекер расходов на топливо",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "FuelTracker" },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <SyncProvider>
          <main className="min-h-screen pb-20">{children}</main>
          <BottomNav />
        </SyncProvider>
      </body>
    </html>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-800 border-t border-surface-700
                    flex items-center justify-around pb-[env(safe-area-inset-bottom)]"
         style={{ zIndex: 50 }}>
      <NavItem href="/"        icon="⛽" label="Главная" />
      <NavItem href="/add"     icon="+" label="Заправка" primary />
      <NavItem href="/history" icon="📋" label="История" />
      <NavItem href="/stats"   icon="📊" label="Статистика" />
      <NavItem href="/cars"    icon="🚗" label="Машины" />
      <NavItem href="/expenses" icon="💸" label="Расходы" />
    </nav>
  );
}

function NavItem({ href, icon, label, primary }: {
  href: string; icon: string; label: string; primary?: boolean;
}) {
  return (
    <a href={href}
      className={`flex flex-col items-center gap-1 py-3 px-3
        ${primary
          ? "bg-brand-500 rounded-2xl text-white -mt-4 px-4 shadow-lg shadow-brand-500/30"
          : "text-slate-400 hover:text-slate-100 transition-colors"}`}>
      <span className={primary ? "text-2xl" : "text-xl"}>{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </a>
  );
}
