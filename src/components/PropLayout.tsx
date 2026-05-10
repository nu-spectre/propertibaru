import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useBalance } from "@/hooks/useBalance";
import { useAuth } from "@/hooks/useAuth";
import { fmt } from "@/lib/utils";

export function PropLayout({ children }: { children: ReactNode }) {
  const { saldo } = useBalance();
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate({ to: "/login" });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  const initials = user?.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "??";

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
        <span className="text-[120px] font-black uppercase tracking-widest opacity-[0.04] rotate-[-25deg] select-none">
          PROPERTI FILM SAJA
        </span>
      </div>
      <div className="pointer-events-none fixed bottom-2 right-3 z-50 text-[10px] uppercase tracking-widest opacity-50">
        
      </div>

      <header className="border-b border-white/5 bg-[var(--surface-1)]/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 sm:size-9 rounded-md bg-[var(--gradient-gold)] grid place-items-center font-black text-black text-base sm:text-lg shadow-[var(--shadow-neon)]">
              X
            </div>
            <div className="leading-none">
              <div className="font-black tracking-tight text-base sm:text-lg">
                TOGEL<span className="text-[var(--neon-gold)]">X99</span>
              </div>
              <div className="text-[8px] sm:text-[9px] uppercase tracking-widest text-[var(--neon-gold)]/70">Film Prop</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-6 text-sm">
            {[
              { to: "/", label: "Beranda" },
              { to: "/togel", label: "Togel" },
              { to: "/slot", label: "Slot" },
              { to: "/deposit", label: "Deposit" },
              { to: "/withdraw", label: "Withdraw" },
            ].map((i) => (
              <Link
                key={i.to}
                to={i.to}
                className="px-3 py-2 rounded-md hover:bg-white/5 transition"
                activeProps={{ className: "px-3 py-2 rounded-md bg-white/10 text-[var(--neon-gold)]" }}
                activeOptions={{ exact: true }}
              >
                {i.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="flex flex-col items-end leading-tight px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-[var(--surface-2)] border border-white/5">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/50">Saldo</span>
              <span className="font-bold text-[var(--neon-gold)] text-[11px] sm:text-sm tabular-nums">
                {fmt(saldo)}
              </span>
            </div>
            <Link
              to="/deposit"
              className="hidden sm:inline-block px-3 py-2 rounded-md bg-[var(--gradient-gold)] text-black font-bold text-sm hover:opacity-90"
            >
              + Deposit
            </Link>
            <button
              onClick={() => { logout(); navigate({ to: "/login" }); }}
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-md bg-white/5 border border-white/10 text-xs text-white/60 hover:text-red-400 hover:border-red-400/30 transition"
            >
              🚪 Keluar
            </button>
            <div className="size-8 sm:size-9 rounded-full bg-[var(--surface-2)] grid place-items-center text-xs sm:text-sm font-bold border border-white/10">
              {initials}
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 bg-black/30 overflow-hidden">
          <div className="whitespace-nowrap py-1 sm:py-1.5 text-[11px] sm:text-xs text-[var(--neon-gold)]/90 animate-[scroll_40s_linear_infinite]">
            🎰 BONUS NEW MEMBER 100% · 💰 WD TERCEPAT 1 MENIT · 🔥 RTP LIVE 98.7% HARI INI · 🎁 CASHBACK MINGGUAN 15% · 📞 LIVECHAT 24 JAM · 🎰 BONUS NEW MEMBER 100% · 💰 WD TERCEPAT 1 MENIT
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 pb-24 md:pb-6 relative z-10">{children}</main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface-1)]/95 backdrop-blur border-t border-white/10 grid grid-cols-5 text-[10px]">
        {[
          { to: "/", label: "Beranda", icon: "🏠" },
          { to: "/togel", label: "Togel", icon: "🎯" },
          { to: "/slot", label: "Slot", icon: "🎰" },
          { to: "/deposit", label: "Deposit", icon: "💰" },
          { to: "/withdraw", label: "WD", icon: "💸" },
        ].map((i) => (
          <Link
            key={i.to}
            to={i.to}
            className="flex flex-col items-center justify-center gap-0.5 py-2 text-white/60"
            activeProps={{ className: "flex flex-col items-center justify-center gap-0.5 py-2 text-[var(--neon-gold)]" }}
            activeOptions={{ exact: true }}
          >
            <span className="text-lg leading-none">{i.icon}</span>
            <span className="font-bold tracking-wide">{i.label}</span>
          </Link>
        ))}
      </nav>

      <footer className="hidden md:block mt-12 border-t border-white/5 py-8 text-center text-xs text-white/40">
        <div>© TOGELX99 — Properti Film Fiksi · Bukan Situs Asli</div>
      </footer>
    </div>
  );
}
