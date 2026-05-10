import { useState, useRef } from "react";
import { useBalance } from "@/hooks/useBalance";
import { fmt } from "@/lib/utils";

type BetType = { label: string; digits: number; mult: number; short: string };

const BET_TYPES: BetType[] = [
  { label: "4D", digits: 4, mult: 3000, short: "x3.000" },
  { label: "3D", digits: 3, mult: 400, short: "x400" },
  { label: "2D", digits: 2, mult: 70, short: "x70" },
  { label: "Colok Bebas", digits: 1, mult: 8, short: "x8" },
];

const PASARANS = [
  { name: "SINGAPORE", code: "SGP", time: "17:45 WIB" },
  { name: "HONGKONG", code: "HK", time: "23:00 WIB" },
  { name: "SYDNEY", code: "SDY", time: "13:30 WIB" },
];

interface HistoryItem {
  nomor: string;
  result: string;
  bet: number;
  pasaran: string;
  type: string;
  win: boolean;
  winAmt: number;
}

const FREE_WIN_QUOTA = 1;

export function TogelGame() {
  const { saldo, deduct, credit } = useBalance();

  const [pasaran, setPasaran] = useState(PASARANS[0]);
  const [betType, setBetType] = useState(BET_TYPES[0]);
  const [nomor, setNomor] = useState("");
  const [betAmt, setBetAmt] = useState(1000);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lastResult, setLastResult] = useState<HistoryItem | null>(null);

  const [isAnimating, setIsAnimating] = useState(false);

  // NEW
  const [isRolling, setIsRolling] = useState(false);
  const [rollingText, setRollingText] = useState("Mengundi nomor...");

  const playCountRef = useRef(0);

  function randomNomor() {
    let n = "";

    for (let i = 0; i < betType.digits; i++) {
      n += Math.floor(Math.random() * 10);
    }

    setNomor(n);
  }

  function handleNomorChange(v: string) {
    setNomor(v.replace(/[^0-9]/g, "").slice(0, betType.digits));
  }

  function addBet(n: number) {
    setBetAmt((prev) => Math.min(saldo, prev + n));
  }

  function generateResult(
    userNomor: string,
    digits: number,
    forceWin: boolean
  ): string {
    if (forceWin) return userNomor;

    let result = "";
    let attempts = 0;

    do {
      result = "";

      for (let i = 0; i < digits; i++) {
        result += Math.floor(Math.random() * 10);
      }

      attempts++;
    } while (result === userNomor && attempts < 50);

    return result;
  }

  function pasang() {
    if (nomor.length < betType.digits) {
      alert(`Masukkan ${betType.digits} digit nomor!`);
      return;
    }

    if (betAmt < 500) {
      alert("Minimal bet Rp 500!");
      return;
    }

    if (!deduct(betAmt)) {
      alert("Saldo tidak cukup!");
      return;
    }

    setIsRolling(true);
    setLastResult(null);

    const texts = [
      "Mengundi nomor...",
      "Menyiapkan result...",
      "Mencocokkan angka...",
      "Menunggu pasaran...",
      "Hampir selesai...",
    ];

    let textIndex = 0;

    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % texts.length;
      setRollingText(texts[textIndex]);
    }, 2000);

    // Delay 10–15 detik
    const delay = Math.floor(Math.random() * 10000);

    setTimeout(() => {
      clearInterval(textInterval);

      playCountRef.current +=1;

      const count = playCountRef.current;

      let forceWin = false;

      if (count <= FREE_WIN_QUOTA) {
        forceWin = true;
      } else {
        forceWin = Math.random() < 0.09;
      }

      const resultNum = generateResult(
        nomor,
        betType.digits,
        forceWin
      );

      const win = resultNum === nomor;

      const winAmt = win ? betAmt * betType.mult : 0;

      if (win) {
        credit(winAmt);
      }

      const item: HistoryItem = {
        nomor,
        result: resultNum,
        bet: betAmt,
        pasaran: pasaran.code,
        type: betType.label,
        win,
        winAmt,
      };

      setLastResult(item);

      setHistory((h) => [item, ...h].slice(0, 8));

      setIsAnimating(true);

      setTimeout(() => {
        setIsAnimating(false);
      }, 400);

      setIsRolling(false);
    }, delay);
  }

  const isReady =
    nomor.length >= betType.digits && betAmt >= 500;

  const remainingFreeWins = Math.max(
    0,
    FREE_WIN_QUOTA - playCountRef.current
  );

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Free Win Badge */}
      {remainingFreeWins > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🎁</span>

          <div>
            <div className="text-xs font-black text-yellow-400 tracking-wide">
              BONUS MEMBER BARU!
            </div>

            <div className="text-[11px] text-white/60">
              {remainingFreeWins} permainan lagi dijamin menang!
            </div>
          </div>
        </div>
      )}

      {/* Pasaran */}
      <div>
        <p className="text-[11px] text-white/40 uppercase tracking-widest mb-2">
          Pilih Pasaran
        </p>

        <div className="grid grid-cols-3 gap-2">
          {PASARANS.map((p) => (
            <button
              key={p.code}
              onClick={() => setPasaran(p)}
              className={`rounded-lg border py-2 px-1 text-center transition-all ${
                pasaran.code === p.code
                  ? "border-[var(--neon-gold)] bg-[var(--neon-gold)]/10"
                  : "border-white/10 bg-white/3 hover:border-white/20"
              }`}
            >
              <div className="text-xs font-bold">
                {p.name}
              </div>

              <div className="text-[10px] text-white/40">
                {p.time}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bet Type */}
      <div>
        <p className="text-[11px] text-white/40 uppercase tracking-widest mb-2">
          Jenis Pasang
        </p>

        <div className="grid grid-cols-4 gap-2">
          {BET_TYPES.map((bt) => (
            <button
              key={bt.label}
              onClick={() => {
                setBetType(bt);
                setNomor("");
              }}
              className={`rounded-lg border py-2 text-center text-xs transition-all ${
                betType.label === bt.label
                  ? "border-[var(--neon-gold)] bg-[var(--neon-gold)]/10 text-[var(--neon-gold)]"
                  : "border-white/10 bg-white/3 text-white/60 hover:border-white/20"
              }`}
            >
              <div className="font-bold">
                {bt.label}
              </div>

              <div className="text-[10px] text-[var(--neon-gold)]/70">
                {bt.short}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Nomor Input */}
      <div>
        <p className="text-[11px] text-white/40 uppercase tracking-widest mb-2">
          Nomor Pilihan
        </p>

        <input
          value={nomor}
          onChange={(e) =>
            handleNomorChange(e.target.value)
          }
          maxLength={betType.digits}
          placeholder={"─".repeat(betType.digits)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center text-3xl font-bold tracking-[0.5em] text-[var(--neon-gold)] focus:outline-none focus:border-[var(--neon-gold)] transition"
        />

        <div className="flex gap-2 mt-2 flex-wrap">
          <span className="text-[11px] text-white/30 self-center">
            Quick:
          </span>

          {["1234", "5678", "0000", "8888"].map((n) => (
            <button
              key={n}
              onClick={() =>
                setNomor(
                  n.slice(0, betType.digits)
                )
              }
              className="px-3 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/50 hover:text-[var(--neon-gold)] hover:border-[var(--neon-gold)]/50 transition"
            >
              {n.slice(0, betType.digits)}
            </button>
          ))}

          <button
            onClick={randomNomor}
            className="px-3 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/50 hover:text-[var(--neon-gold)] hover:border-[var(--neon-gold)]/50 transition"
          >
            🎲 Acak
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex justify-between bg-white/3 border border-white/5 rounded-lg px-4 py-2.5 text-xs">
        <span className="text-white/40">
          Pasaran:{" "}
          <span className="text-[var(--neon-gold)] font-bold">
            {pasaran.code}
          </span>
        </span>

        <span className="text-white/40">
          Jenis:{" "}
          <span className="text-[var(--neon-gold)] font-bold">
            {betType.label}
          </span>
        </span>

        <span className="text-white/40">
          Bayar:{" "}
          <span className="text-[var(--neon-gold)] font-bold">
            {betType.short}
          </span>
        </span>
      </div>

      {/* Bet Amount */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[11px] text-white/40 uppercase tracking-widest">
            Nominal Bet
          </span>

          <input
            type="number"
            value={betAmt}
            min={500}
            step={500}
            onChange={(e) =>
              setBetAmt(
                Math.max(
                  500,
                  Math.min(
                    saldo,
                    parseInt(e.target.value) || 500
                  )
                )
              )
            }
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-right text-[var(--neon-gold)] font-bold text-lg focus:outline-none focus:border-[var(--neon-gold)] transition"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {[1000, 5000, 10000, 50000, 100000].map((n) => (
            <button
              key={n}
              onClick={() => addBet(n)}
              className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-white/50 hover:text-[var(--neon-gold)] hover:border-[var(--neon-gold)]/50 transition"
            >
              +{n >= 1000 ? `${n / 1000}rb` : n}
            </button>
          ))}

          <button
            onClick={() => setBetAmt(saldo)}
            className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-white/50 hover:text-[var(--neon-gold)] hover:border-[var(--neon-gold)]/50 transition"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Potensi menang */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-white/40">
          Potensi menang:
        </span>

        <span className="text-[var(--neon-gold)] font-bold text-lg">
          {fmt(betAmt * betType.mult)}
        </span>
      </div>

      {/* BUTTON */}
      <button
        onClick={pasang}
        disabled={!isReady || isRolling}
        className={`w-full font-black rounded-2xl py-5 text-xl tracking-widest transition-all shadow-xl ${
          isReady && !isRolling
            ? "bg-[var(--gradient-gold)] text-white hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_30px_rgba(245,200,66,0.5)]"
            : "bg-white/10 text-white/25 cursor-not-allowed"
        }`}
      >
        {isRolling
          ? "⏳ MENUNGGU HASIL..."
          : isReady
          ? "🎯 PASANG TOGEL"
          : "Lengkapi nomor & nominal"}
      </button>

      {/* Rolling Animation */}
      {isRolling && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center animate-pulse">
          <div className="text-5xl mb-3">
            🎰
          </div>

          <div className="text-lg font-black text-[var(--neon-gold)] tracking-widest">
            {rollingText}
          </div>

          <div className="text-xs text-white/40 mt-2">
            Harap tunggu hasil pasaran...
          </div>

          <div className="flex justify-center gap-2 mt-4">
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce delay-100"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce delay-200"></div>
          </div>
        </div>
      )}

      {/* Result */}
      {lastResult && (
        <div
          className={`rounded-xl border p-4 text-center transition-all ${
            lastResult.win
              ? "border-green-500/50 bg-green-500/10"
              : "border-red-500/30 bg-red-500/5"
          } ${
            isAnimating
              ? "scale-105"
              : "scale-100"
          }`}
        >
          <div className="text-xs text-white/40 mb-1">
            Nomor keluar:{" "}
            <span className="font-black text-[var(--neon-gold)] tracking-widest">
              {lastResult.result}
            </span>
          </div>

          <div
            className={`text-2xl font-black ${
              lastResult.win
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {lastResult.win
              ? `+ ${fmt(lastResult.winAmt)}`
              : `- ${fmt(lastResult.bet)}`}
          </div>

          <div className="text-xs text-white/40 mt-1">
            {lastResult.win
              ? "🎉 SELAMAT! Nomor kamu TEMBUS!"
              : "😔 Belum beruntung. Coba lagi!"}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="border-t border-white/5 pt-4">
          <p className="text-[11px] text-white/30 uppercase tracking-widest mb-3">
            Riwayat Pasang
          </p>

          <div className="space-y-2">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex justify-between items-center py-2 border-b border-white/5"
              >
                <div>
                  <div className="font-bold tracking-widest text-sm">
                    {h.nomor} → {h.result}
                  </div>

                  <div className="text-[10px] text-white/30">
                    {h.pasaran} · {h.type} ·{" "}
                    {fmt(h.bet)}
                  </div>
                </div>

                <div
                  className={`font-black text-sm ${
                    h.win
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {h.win
                    ? `+${fmt(h.winAmt)}`
                    : `-${fmt(h.bet)}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}