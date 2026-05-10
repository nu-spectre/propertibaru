import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PropLayout } from "@/components/PropLayout";
import { useBalance } from "@/hooks/useBalance";
import { useAuth } from "@/hooks/useAuth";
import { fmt } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { saldo } = useBalance();
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) navigate({ to: "/login" });
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  return (
    <PropLayout>
      <div className="space-y-6">
        {/* Hero */}
        <div className="rounded-2xl overflow-hidden border border-white/5 relative bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] p-6 text-center">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--neon-gold)_0%,_transparent_70%)]" />
          <div className="relative z-10">
            <div className="text-4xl mb-2">🎰</div>
            <h1 className="text-2xl font-black tracking-tight mb-1">
              SELAMAT DATANG, <span className="text-[var(--neon-gold)]">{user?.displayName.toUpperCase()}</span>
            </h1>
            <p className="text-white/50 text-xs mb-1">Dengan Satu Kali Klik Uang Anda Akan Berlipat Ganda</p>
            <div className="mt-3 inline-block bg-[var(--neon-gold)]/10 border border-[var(--neon-gold)]/30 rounded-xl px-6 py-3">
              <div className="text-xs text-white/40 mb-1">SALDO ANDA</div>
              <div className="text-2xl font-black text-[var(--neon-gold)]">{fmt(saldo)}</div>
            </div>
            {saldo === 0 && (
              <div className="mt-3">
                <Link
                  to="/deposit"
                  className="inline-block bg-[var(--gradient-gold)] text-black font-black rounded-xl px-6 py-2.5 text-sm tracking-widest hover:opacity-90 transition"
                >
                  💰 DEPOSIT SEKARANG
                </Link>
                <p className="text-[11px] text-white/30 mt-2">Deposit dulu untuk mulai bermain!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Menu */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { to: "/togel", emoji: "🎯", label: "Togel", desc: "4D·3D·2D·Colok", locked: saldo === 0 },
            { to: "/slot", emoji: "🎰", label: "Slot", desc: "3 Game Tersedia", locked: saldo === 0 },
            { to: "/deposit", emoji: "💰", label: "Deposit", desc: "Min. Rp 10.000", locked: false },
            { to: "/withdraw", emoji: "💸", label: "Withdraw", desc: "Proses 1 Menit", locked: false },
          ].map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className={`block rounded-xl border border-white/8 bg-white/3 hover:border-[var(--neon-gold)]/40 hover:bg-[var(--neon-gold)]/5 transition-all p-4 text-center group relative ${m.locked ? "opacity-60" : ""}`}
            >
              <div className="text-3xl mb-2">{m.emoji}</div>
              <div className="font-bold text-sm group-hover:text-[var(--neon-gold)] transition">{m.label}</div>
              <div className="text-[11px] text-white/30 mt-0.5">{m.desc}</div>
              {m.locked && (
                <div className="absolute top-2 right-2 text-[10px] bg-red-500/80 text-white px-1.5 py-0.5 rounded font-bold">
                  🔒
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Promo Banner */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { emoji: "🎁", title: "BONUS NEW MEMBER", desc: "Dapatkan bonus 100% untuk deposit pertama kamu!", badge: "HOT" },
            { emoji: "💰", title: "CASHBACK MINGGUAN", desc: "Cashback 15% setiap minggu untuk semua member aktif", badge: "PROMO" },
            { emoji: "🔥", title: "RTP LIVE 98.7%", desc: "RTP tertinggi hari ini. Main sekarang sebelum habis!", badge: "TODAY" },
          ].map((p) => (
            <div key={p.title} className="rounded-xl border border-white/8 bg-white/3 p-4 relative overflow-hidden">
              <div className="absolute top-2 right-2 text-[10px] bg-[var(--neon-gold)] text-black font-black px-2 py-0.5 rounded">
                {p.badge}
              </div>
              <div className="text-2xl mb-2">{p.emoji}</div>
              <div className="font-bold text-sm mb-1">{p.title}</div>
              <div className="text-xs text-white/40">{p.desc}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="text-center text-[11px] text-white/20 border border-white/5 rounded-xl p-4">
          ⚠️ Ini adalah properti film fiksi. Semua transaksi bersifat simulasi dan tidak nyata. Dibuat untuk keperluan produksi film.
        </div>
      </div>
    </PropLayout>
  );
}
