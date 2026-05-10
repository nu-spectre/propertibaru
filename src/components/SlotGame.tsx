import { useState, useRef } from "react";
import { useBalance } from "@/hooks/useBalance";
import { fmt } from "@/lib/utils";

const SLOT_SYMBOLS = [
  { id: "cherry",  img: "https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=80&h=80&fit=crop&auto=format", label: "Ceri" },
  { id: "diamond", img: "https://www.shutterstock.com/image-vector/shinning-diamond-cartoon-vector-illustration-600nw-2675621967.jpg", label: "Berlian" },
  { id: "seven",   img: "https://blastostitch.com/wp-content/uploads/2015/10/Slot-Machine-Number-Seven-Stitched-5_5-Inch.jpg", label: "Tujuh" },
  { id: "gold",    img: "https://media.istockphoto.com/id/1455233823/vector/stack-of-gold-bar-icon-ingot-symbol-of-richness-currency-investment-treasury-luxury-rich.jpg?s=612x612&w=0&k=20&c=xKfMgZBuLNDUDqqaQL-FYYSWoEtxzP2sMC_UiuU8ohE=", label: "Emas" },
  { id: "coin",    img: "https://img.freepik.com/vektor-premium/ikon-koin-emas-dengan-semanggi-untuk-hari-st-patrick_109161-6979.jpg", label: "Koin" },
  { id: "clover",  img: "https://www.shutterstock.com/shutterstock/videos/4000937315/thumb/1.jpg?ip=x480", label: "Semanggi" },
  { id: "star",    img: "https://img.magnific.com/vektor-gratis/bintang-metal-3d-terisolasi_1308-115283.jpg", label: "Bintang" },
];

const SLOT_GAMES = [
  { name: "Dragon Fortune", emoji: "🐉", rtp: "96.8%", symbolIds: ["cherry","diamond","seven","gold","coin","clover","star"] },
  { name: "Diamond King",   emoji: "💎", rtp: "97.2%", symbolIds: ["diamond","gold","coin","star","cherry","clover","seven"] },
  { name: "Lucky Clover",   emoji: "🍀", rtp: "95.5%", symbolIds: ["clover","star","cherry","coin","seven","diamond","gold"] },
];

function getSymbol(id: string) {
  return SLOT_SYMBOLS.find(s => s.id === id) ?? SLOT_SYMBOLS[0];
}

interface SpinResult {
  reelIds: string[];
  bet: number;
  win: boolean;
  winAmt: number;
  mult: number;
  msg: string;
  gameName: string;
}

const FREE_WIN_QUOTA = 3; // 5 spin pertama selalu menang

export function SlotGame() {
  const { saldo, deduct, credit } = useBalance();
  const [gameIdx, setGameIdx] = useState(0);
  const [slotBet, setSlotBet] = useState(1000);
  const [reelIds, setReelIds] = useState<string[]>(["cherry","diamond","seven","gold","cherry"]);
  const [spinning, setSpinning] = useState([false, false, false, false, false]);
  const [winReels, setWinReels] = useState<number[]>([]);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [history, setHistory] = useState<SpinResult[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const intervalRefs = useRef<ReturnType<typeof setInterval>[]>([]);
  const playCountRef = useRef(0);

  const game = SLOT_GAMES[gameIdx];

  function selectGame(idx: number) {
    if (isSpinning) return;
    setGameIdx(idx);
    const syms = SLOT_GAMES[idx].symbolIds;
    setReelIds(Array.from({ length: 5 }, () => syms[Math.floor(Math.random() * syms.length)]));
    setWinReels([]);
    setLastResult(null);
  }

  function adjBet(delta: number) {
    setSlotBet((prev) => Math.max(500, Math.min(saldo, prev + delta)));
  }

  function doSpin() {
    if (isSpinning) return;
    if (!deduct(slotBet)) { alert("Saldo tidak cukup!"); return; }

    playCountRef.current += 1;
    const count = playCountRef.current;

    let forceWin = false;
    if (count <= FREE_WIN_QUOTA) {
      forceWin = true;
    } else {
      forceWin = Math.random() < 0.10; // 10% menang
    }

    setIsSpinning(true);
    setWinReels([]);
    setLastResult(null);

    const syms = game.symbolIds;
    const tempReels: string[] = [...reelIds];

    setSpinning([true, true, true, true, true]);

    intervalRefs.current = [];
    for (let r = 0; r < 5; r++) {
      intervalRefs.current[r] = setInterval(() => {
        tempReels[r] = syms[Math.floor(Math.random() * syms.length)];
        setReelIds([...tempReels]);
      }, 80);
    }

    const finalReels: string[] = [];
    const stopDelays = [500, 700, 900, 1100, 1300];

    // Tentukan hasil akhir
    let chosenReels: string[];
    if (forceWin) {
      // 3 simbol sama untuk menang pasti (x10)
      const winSym = syms[Math.floor(Math.random() * syms.length)];
      chosenReels = [winSym, winSym, winSym, syms[Math.floor(Math.random() * syms.length)], syms[Math.floor(Math.random() * syms.length)]];
      // shuffle ringan agar tidak selalu posisi 0-1-2
    } else {
      // Pastikan tidak ada 3 sama
      let attempts = 0;
      do {
        chosenReels = Array.from({ length: 5 }, () => syms[Math.floor(Math.random() * syms.length)]);
        attempts++;
        const counts: Record<string, number> = {};
        chosenReels.forEach(s => counts[s] = (counts[s] || 0) + 1);
        const maxM = Math.max(...Object.values(counts));
        if (maxM < 3) break;
      } while (attempts < 30);
    }

    stopDelays.forEach((delay, i) => {
      setTimeout(() => {
        clearInterval(intervalRefs.current[i]);
        const sym = chosenReels[i];
        finalReels[i] = sym;
        tempReels[i] = sym;
        setReelIds([...tempReels]);
        setSpinning((prev) => {
          const next = [...prev];
          next[i] = false;
          return next;
        });
        if (i === 4) {
          setTimeout(() => resolveResult(finalReels), 200);
        }
      }, delay);
    });
  }

  function resolveResult(finalReels: string[]) {
    const counts: Record<string, number> = {};
    finalReels.forEach((s) => (counts[s] = (counts[s] || 0) + 1));
    const maxMatch = Math.max(...Object.values(counts));
    const matchSym = Object.keys(counts).find((k) => counts[k] === maxMatch)!;

    let multiplier = 0;
    let msg = "Tidak ada kombinasi menang";
    const wins: number[] = [];

    if (maxMatch === 5) {
      multiplier = 500; msg = "🎉 JACKPOT! 5 Sama!";
      wins.push(0, 1, 2, 3, 4);
    } else if (maxMatch === 4) {
      multiplier = 50; msg = "🔥 SUPER WIN! 4 Sama!";
      finalReels.forEach((s, i) => { if (s === matchSym) wins.push(i); });
    } else if (maxMatch === 3) {
      multiplier = 10; msg = "✨ WIN! 3 Sama!";
      finalReels.forEach((s, i) => { if (s === matchSym) wins.push(i); });
    } else if (maxMatch === 2 && Math.random() < 0.3) {
      multiplier = 2; msg = "💰 Mini Win! 2 Sama!";
      finalReels.forEach((s, i) => { if (s === matchSym) wins.push(i); });
    }

    setWinReels(wins);
    const win = multiplier > 0;
    const winAmt = slotBet * multiplier;
    if (win) credit(winAmt);

    const result: SpinResult = {
      reelIds: finalReels,
      bet: slotBet,
      win,
      winAmt,
      mult: multiplier,
      msg,
      gameName: game.name,
    };

    setLastResult(result);
    setHistory((h) => [result, ...h].slice(0, 8));
    setIsSpinning(false);
  }

  const remainingFreeWins = Math.max(0, FREE_WIN_QUOTA - playCountRef.current);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Free Win Badge */}
      {remainingFreeWins > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🎁</span>
          <div>
            <div className="text-xs font-black text-yellow-400 tracking-wide">BONUS MEMBER BARU!</div>
            <div className="text-[11px] text-white/60">{remainingFreeWins} spin lagi dijamin menang!</div>
          </div>
        </div>
      )}

      {/* Game Select */}
      <div>
        <p className="text-[11px] text-white/40 uppercase tracking-widest mb-2">Pilih Game</p>
        <div className="grid grid-cols-3 gap-2">
          {SLOT_GAMES.map((g, i) => (
            <button
              key={g.name}
              onClick={() => selectGame(i)}
              className={`rounded-lg border py-3 text-center transition-all ${
                gameIdx === i
                  ? "border-[var(--neon-gold)] bg-[var(--neon-gold)]/10"
                  : "border-white/10 bg-white/3 hover:border-white/20"
              }`}
            >
              <div className="text-2xl mb-1">{g.emoji}</div>
              <div className="text-[11px] font-bold">{g.name}</div>
              <div className="text-[10px] text-[var(--neon-gold)]/60">RTP {g.rtp}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Slot Machine */}
      <div className="bg-white/3 border border-white/8 rounded-xl p-5">
        <div className="text-center font-black text-[var(--neon-gold)] tracking-widest text-base mb-4">
          {game.emoji} {game.name.toUpperCase()}
        </div>

        {/* Reels */}
        <div className="flex gap-2 justify-center mb-5">
          {reelIds.map((symId, i) => {
            const sym = getSymbol(symId);
            return (
              <div
                key={i}
                className={`w-[62px] h-[70px] rounded-lg border overflow-hidden flex items-center justify-center transition-all duration-200 ${
                  winReels.includes(i)
                    ? "border-[var(--neon-gold)] shadow-[0_0_16px_rgba(245,200,66,0.5)] scale-105"
                    : "border-white/10 bg-black/30"
                } ${spinning[i] ? "brightness-150 contrast-110" : ""}`}
              >
                <img
                  src={sym.img}
                  alt={sym.label}
                  className={`w-full h-full object-cover transition-all ${spinning[i] ? "blur-[2px] scale-110" : ""}`}
                  draggable={false}
                />
              </div>
            );
          })}
        </div>

        {/* Symbol legend */}
        <div className="flex gap-1.5 justify-center mb-4 flex-wrap">
          {SLOT_SYMBOLS.map(sym => (
            <div key={sym.id} className="flex flex-col items-center gap-0.5">
              <img src={sym.img} alt={sym.label} className="w-7 h-7 rounded object-cover opacity-60" />
              <span className="text-[8px] text-white/30">{sym.label}</span>
            </div>
          ))}
        </div>

        {/* Bet Control */}
        <div className="flex items-center gap-3 justify-center mb-4">
          <button
            onClick={() => adjBet(-1000)}
            disabled={isSpinning}
            className="w-10 h-10 rounded-xl bg-white/8 border border-white/15 text-[var(--neon-gold)] font-black text-2xl flex items-center justify-center hover:bg-white/15 disabled:opacity-40 transition"
          >
            −
          </button>
          <div className="font-black text-[var(--neon-gold)] text-xl min-w-28 text-center">
            {fmt(slotBet)}
          </div>
          <button
            onClick={() => adjBet(1000)}
            disabled={isSpinning}
            className="w-10 h-10 rounded-xl bg-white/8 border border-white/15 text-[var(--neon-gold)] font-black text-2xl flex items-center justify-center hover:bg-white/15 disabled:opacity-40 transition"
          >
            +
          </button>
        </div>

        <div className="flex gap-2 justify-center mb-5 flex-wrap">
          {[500, 1000, 5000, 10000, 50000].map((n) => (
            <button
              key={n}
              onClick={() => setSlotBet(Math.min(saldo, n))}
              disabled={isSpinning}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/12 text-[11px] text-white/60 hover:text-[var(--neon-gold)] hover:border-[var(--neon-gold)]/50 disabled:opacity-40 transition font-semibold"
            >
              {n >= 1000 ? `${n / 1000}K` : n}
            </button>
          ))}
        </div>

        {/* ===== SPIN BUTTON — TERANG & BESAR ===== */}
        <button
          onClick={doSpin}
          disabled={isSpinning}
          className={`w-full font-black rounded-2xl py-5 text-2xl tracking-[0.15em] transition-all ${
            isSpinning
              ? "bg-white/10 text-white/30 cursor-not-allowed"
              : "bg-[var(--gradient-gold)] text-white hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_30px_rgba(245,200,66,0.6)]"
          }`}
        >
          {isSpinning ? "⏳ SPINNING..." : "⚡ SPIN"}
        </button>
      </div>

      {/* Paytable */}
      <div className="grid grid-cols-2 gap-2 text-xs text-white/40">
        <div className="bg-white/3 rounded-lg p-2 flex justify-between">
          <span>5 Sama</span><span className="text-[var(--neon-gold)] font-bold">x500 🎰 JACKPOT</span>
        </div>
        <div className="bg-white/3 rounded-lg p-2 flex justify-between">
          <span>4 Sama</span><span className="text-[var(--neon-gold)] font-bold">x50</span>
        </div>
        <div className="bg-white/3 rounded-lg p-2 flex justify-between">
          <span>3 Sama</span><span className="text-[var(--neon-gold)] font-bold">x10</span>
        </div>
        <div className="bg-white/3 rounded-lg p-2 flex justify-between">
          <span>2 Sama</span><span className="text-[var(--neon-gold)] font-bold">x2</span>
        </div>
      </div>

      {/* Result */}
      {lastResult && (
        <div
          className={`rounded-xl border p-4 text-center ${
            lastResult.win ? "border-green-500/50 bg-green-500/10" : "border-red-500/30 bg-red-500/5"
          }`}
        >
          <div className="text-xs text-white/40 mb-1">{lastResult.msg}</div>
          <div className={`text-2xl font-black ${lastResult.win ? "text-green-400" : "text-red-400"}`}>
            {lastResult.win ? `+ ${fmt(lastResult.winAmt)}` : `- ${fmt(lastResult.bet)}`}
          </div>
          {lastResult.win && (
            <div className="text-xs text-white/40 mt-1">Multiplier: x{lastResult.mult}</div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="border-t border-white/5 pt-4">
          <p className="text-[11px] text-white/30 uppercase tracking-widest mb-3">Riwayat Spin</p>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                <div className="flex items-center gap-1.5">
                  {h.reelIds.map((id, j) => {
                    const sym = getSymbol(id);
                    return <img key={j} src={sym.img} alt={sym.label} className="w-6 h-6 rounded object-cover" />;
                  })}
                </div>
                <div className={`font-black text-sm ${h.win ? "text-green-400" : "text-red-400"}`}>
                  {h.win ? `+${fmt(h.winAmt)}` : `-${fmt(h.bet)}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
