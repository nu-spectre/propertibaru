import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PropLayout } from "@/components/PropLayout";
import { TogelGame } from "@/components/TogelGame";
import { useBalance } from "@/hooks/useBalance";
import { useAuth } from "@/hooks/useAuth";
import { fmt } from "@/lib/utils";

export const Route = createFileRoute("/togel")({
  component: TogelPage,
});

function TogelPage() {
  const { isLoggedIn } = useAuth();
  const { saldo } = useBalance();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) navigate({ to: "/login" });
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  const canPlay = saldo > 0;

  return (
    <PropLayout>
      <div className="mb-5">
        <h1 className="text-xl font-black tracking-tight">🎯 TOGEL</h1>
        <p className="text-xs text-white/30 mt-0.5">Properti Film Fiksi · Simulasi Pasang Nomor</p>
      </div>
      {!canPlay ? (
        <div className="max-w-sm mx-auto text-center py-12 space-y-4">
          <div className="text-5xl">💳</div>
          <h2 className="text-lg font-black text-white/80">Saldo Tidak Cukup</h2>
          <p className="text-sm text-white/40">Saldo kamu saat ini <span className="text-[var(--neon-gold)] font-bold">{fmt(saldo)}</span>. Lakukan deposit terlebih dahulu untuk bermain Togel.</p>
          <button
            onClick={() => navigate({ to: "/deposit" })}
            className="inline-block bg-[var(--gradient-gold)] text-black font-black rounded-xl px-8 py-3 text-sm tracking-widest hover:opacity-90 transition"
          >
            💰 DEPOSIT SEKARANG
          </button>
        </div>
      ) : (
        <TogelGame />
      )}
    </PropLayout>
  );
}
