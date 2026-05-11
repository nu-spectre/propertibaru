import { useState, useRef, useEffect } from "react";
import { useBalance } from "@/hooks/useBalance";
import { fmt } from "@/lib/utils";

// ======== MAHJONG WAYS STYLE SYMBOLS ========
const SYMBOLS = [
  { id: "dragon",   emoji: "🐉", label: "Naga",     color: "#FF4444", mult: [0,0,5,20,100,500] },
  { id: "phoenix",  emoji: "🦅", label: "Phoenix",  color: "#FF8800", mult: [0,0,4,15,80,300] },
  { id: "jade",     emoji: "💚", label: "Jade",     color: "#00CC66", mult: [0,0,3,10,50,200] },
  { id: "coin",     emoji: "🪙", label: "Koin",     color: "#FFD700", mult: [0,0,2,8,30,100] },
  { id: "fan",      emoji: "🪭", label: "Kipas",    color: "#CC66FF", mult: [0,0,2,6,20,80] },
  { id: "bamboo",   emoji: "🎍", label: "Bambu",    color: "#66CCAA", mult: [0,0,1,5,15,60] },
  { id: "fish",     emoji: "🐠", label: "Ikan",     color: "#44AAFF", mult: [0,0,1,4,12,40] },
  { id: "lotus",    emoji: "🪷", label: "Lotus",    color: "#FF66AA", mult: [0,0,1,3,10,30] },
  { id: "wild",     emoji: "⭐", label: "WILD",     color: "#FFD700", mult: [0,0,0,0,0,0] },
  { id: "scatter",  emoji: "🎴", label: "SCATTER",  color: "#FFAA00", mult: [0,0,0,0,0,0] },
];

// Grid: 6 columns × 5 rows (Mahjong Ways style)
const COLS = 6;
const ROWS = 5;

type CellSym = { id: string; emoji: string; label: string; color: string };

function randomSym(excludeWild = false): CellSym {
  const pool = excludeWild ? SYMBOLS.filter(s => s.id !== "wild" && s.id !== "scatter") : SYMBOLS.slice(0, 8);
  return pool[Math.floor(Math.random() * pool.length)];
}

function makeGrid(): CellSym[][] {
  return Array.from({ length: COLS }, () =>
    Array.from({ length: ROWS }, () => randomSym())
  );
}

interface WinLine {
  symbol: string;
  count: number;
  positions: [number, number][];
  winAmt: number;
}

interface SpinResult {
  grid: CellSym[][];
  winLines: WinLine[];
  totalWin: number;
  bet: number;
  scatterCount: number;
  freeSpins: boolean;
}

const GAMES = [
  { name: "Mahjong Dragon",    emoji: "🐉", rtp: "97.0%", bg: "from-red-900/40 to-black" },
  { name: "Fortune Phoenix",   emoji: "🦅", rtp: "96.5%", bg: "from-orange-900/40 to-black" },
  { name: "Jade Dynasty",      emoji: "💚", rtp: "96.8%", bg: "from-green-900/40 to-black" },
];

const FREE_WIN_QUOTA = 3;

function evalGrid(grid: CellSym[][], bet: number): { winLines: WinLine[]; totalWin: number } {
  const winLines: WinLine[] = [];
  let totalWin = 0;

  // Check left-to-right clusters per symbol (ways-to-win style)
  for (const sym of SYMBOLS.filter(s => s.id !== "wild" && s.id !== "scatter")) {
    // Count how many columns have this symbol (with wild expansion)
    let colPositions: [number, number][][] = [];
    let valid = true;

    for (let c = 0; c < COLS; c++) {
      const matchRows: [number, number][] = [];
      for (let r = 0; r < ROWS; r++) {
        if (grid[c][r].id === sym.id || grid[c][r].id === "wild") {
          matchRows.push([c, r]);
        }
      }
      if (matchRows.length === 0) { valid = false; break; }
      colPositions.push(matchRows);
    }

    if (valid && colPositions.length >= 3) {
      // Simplify: take one position per column
      const positions: [number, number][] = colPositions.map(cp => cp[0]);
      const symDef = SYMBOLS.find(s => s.id === sym.id)!;
      const count = colPositions.length;
      const mult = symDef.mult[count] ?? symDef.mult[5];
      const winAmt = bet * mult;
      if (winAmt > 0) {
        winLines.push({ symbol: sym.id, count, positions, winAmt });
        totalWin += winAmt;
      }
    }
  }

  return { winLines, totalWin };
}

export function SlotGame() {
  const { saldo, deduct, credit } = useBalance();

  const [gameIdx, setGameIdx] = useState(0);
  const [bet, setBet] = useState(1000);
  const [grid, setGrid] = useState<CellSym[][]>(makeGrid);
  const [spinGrid, setSpinGrid] = useState<boolean[][]>(Array.from({ length: COLS }, () => Array(ROWS).fill(false)));
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [winCells, setWinCells] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<SpinResult[]>([]);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winPopupAmt, setWinPopupAmt] = useState(0);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [showFreeSpinIntro, setShowFreeSpinIntro] = useState(false);

  const playCountRef = useRef(0);

  const game = GAMES[gameIdx];

  function adjBet(delta: number) {
    setBet(prev => Math.max(500, Math.min(saldo, prev + delta)));
  }

  function doSpin(isFree = false) {
    if (isSpinning) return;
    if (!isFree) {
      if (!deduct(bet)) { alert("Saldo tidak cukup!"); return; }
    }

    playCountRef.current += 1;
    const count = playCountRef.current;
    const forceWin = count <= FREE_WIN_QUOTA ? true : Math.random() < 0.12;

    setIsSpinning(true);
    setLastResult(null);
    setWinCells(new Set());

    // Animate: all columns spinning
    setSpinGrid(Array.from({ length: COLS }, () => Array(ROWS).fill(true)));

    // Rolling animation - update grid rapidly
    const rollInterval = setInterval(() => {
      setGrid(makeGrid());
    }, 60);

    // Stop columns one by one
    const stopDelays = [400, 600, 800, 1000, 1200, 1400];
    const finalGrid: CellSym[][] = makeGrid();

    // If force win, ensure at least 3 columns match a symbol
    if (forceWin) {
      const winSym = SYMBOLS[Math.floor(Math.random() * 4)]; // pick premium symbol
      for (let c = 0; c < 4; c++) {
        const r = Math.floor(Math.random() * ROWS);
        finalGrid[c][r] = winSym;
      }
    }

    stopDelays.forEach((delay, colIdx) => {
      setTimeout(() => {
        setSpinGrid(prev => {
          const next = prev.map(col => [...col]);
          next[colIdx] = Array(ROWS).fill(false);
          return next;
        });
        setGrid(prev => {
          const next = prev.map(col => [...col]);
          next[colIdx] = finalGrid[colIdx];
          return next;
        });

        if (colIdx === COLS - 1) {
          clearInterval(rollInterval);
          setTimeout(() => resolveResult(finalGrid, isFree), 200);
        }
      }, delay);
    });
  }

  function resolveResult(finalGrid: CellSym[][], isFree: boolean) {
    const { winLines, totalWin } = evalGrid(finalGrid, bet);

    // Count scatters
    let scatterCount = 0;
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) if (finalGrid[c][r].id === "scatter") scatterCount++;
    const triggerFreeSpins = scatterCount >= 3;

    const actualWin = totalWin;
    if (actualWin > 0) credit(actualWin);

    // Highlight win cells
    const winSet = new Set<string>();
    winLines.forEach(line => line.positions.forEach(([c, r]) => winSet.add(`${c}-${r}`)));
    setWinCells(winSet);

    const result: SpinResult = {
      grid: finalGrid,
      winLines,
      totalWin: actualWin,
      bet,
      scatterCount,
      freeSpins: triggerFreeSpins,
    };

    setLastResult(result);
    setHistory(h => [result, ...h].slice(0, 6));
    setIsSpinning(false);

    if (actualWin > 0) {
      setWinPopupAmt(actualWin);
      setShowWinPopup(true);
    }

    if (triggerFreeSpins) {
      setFreeSpinsLeft(10);
      setShowFreeSpinIntro(true);
    }
  }

  // Auto free spin
  useEffect(() => {
    if (freeSpinsLeft > 0 && !isSpinning && !showFreeSpinIntro) {
      const t = setTimeout(() => {
        setFreeSpinsLeft(p => p - 1);
        doSpin(true);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [freeSpinsLeft, isSpinning, showFreeSpinIntro]);

  const remainingFreeWins = Math.max(0, FREE_WIN_QUOTA - playCountRef.current);

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* WIN POPUP */}
      {showWinPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowWinPopup(false)}>
          <style>{`@keyframes popIn { from { transform: scale(0.3) rotate(-10deg); opacity:0; } to { transform: scale(1) rotate(0deg); opacity:1; } } .win-pop { animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }`}</style>
          <div className="win-pop relative mx-4 max-w-sm w-full rounded-3xl border-4 border-yellow-400 bg-gradient-to-b from-yellow-900 via-black to-yellow-900 p-8 text-center shadow-[0_0_80px_rgba(245,200,66,0.9)]" onClick={e => e.stopPropagation()}>
            <div className="text-6xl mb-2 animate-bounce">🎰</div>
            <div className="text-2xl font-black text-yellow-300 tracking-widest mb-1">ANDA MENANG!</div>
            <div className="text-5xl font-black text-yellow-400 my-4" style={{ textShadow: "0 0 40px rgba(245,200,66,0.9)" }}>{fmt(winPopupAmt)}</div>
            <div className="text-xs text-white/40 mb-6">Kemenangan telah dikreditkan ke saldo!</div>
            <button onClick={() => setShowWinPopup(false)} className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-300 text-black font-black text-lg tracking-widest hover:opacity-90 transition">AMBIL 🏆</button>
            <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-yellow-400 animate-ping"></div>
            <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-yellow-400 animate-ping" style={{animationDelay:"0.15s"}}></div>
            <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-yellow-400 animate-ping" style={{animationDelay:"0.3s"}}></div>
            <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-yellow-400 animate-ping" style={{animationDelay:"0.5s"}}></div>
          </div>
        </div>
      )}

      {/* FREE SPIN INTRO */}
      {showFreeSpinIntro && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setShowFreeSpinIntro(false)}>
          <div className="mx-4 max-w-xs w-full rounded-3xl border-4 border-purple-400 bg-gradient-to-b from-purple-900 via-black to-purple-900 p-8 text-center shadow-[0_0_60px_rgba(168,85,247,0.8)]">
            <div className="text-6xl mb-3 animate-spin">🎴</div>
            <div className="text-2xl font-black text-purple-300 tracking-widest mb-2">FREE SPINS!</div>
            <div className="text-4xl font-black text-white mb-4">10x</div>
            <div className="text-sm text-white/50 mb-6">3 Scatter terdeteksi! Nikmati 10 Free Spins!</div>
            <button onClick={() => setShowFreeSpinIntro(false)} className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-300 text-black font-black text-lg tracking-widest hover:opacity-90 transition">MULAI FREE SPIN!</button>
          </div>
        </div>
      )}

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

      {freeSpinsLeft > 0 && (
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/40 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎴</span>
            <span className="text-sm font-black text-purple-300">FREE SPINS AKTIF!</span>
          </div>
          <span className="text-2xl font-black text-purple-300">{freeSpinsLeft}x</span>
        </div>
      )}

      {/* Game Select */}
      <div>
        <p className="text-[11px] text-white/40 uppercase tracking-widest mb-2">Pilih Game</p>
        <div className="grid grid-cols-3 gap-2">
          {GAMES.map((g, i) => (
            <button key={g.name} onClick={() => { if (!isSpinning) setGameIdx(i); }} className={`rounded-lg border py-3 text-center transition-all ${gameIdx === i ? "border-[var(--neon-gold)] bg-[var(--neon-gold)]/10" : "border-white/10 bg-white/3 hover:border-white/20"}`}>
              <div className="text-2xl mb-1">{g.emoji}</div>
              <div className="text-[11px] font-bold leading-tight">{g.name}</div>
              <div className="text-[10px] text-[var(--neon-gold)]/60">RTP {g.rtp}</div>
            </button>
          ))}
        </div>
      </div>

      {/* SLOT MACHINE - Mahjong Ways 6x5 Grid */}
      <div className={`rounded-2xl border border-white/10 bg-gradient-to-b ${game.bg} overflow-hidden`}>
        {/* Header */}
        <div className="text-center py-3 border-b border-white/10 bg-black/30">
          <span className="font-black text-[var(--neon-gold)] tracking-widest text-base">{game.emoji} {game.name.toUpperCase()}</span>
        </div>

        {/* Grid 6x5 */}
        <div className="p-4">
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
            {Array.from({ length: COLS }).map((_, c) => (
              <div key={c} className="flex flex-col gap-1.5">
                {Array.from({ length: ROWS }).map((_, r) => {
                  const cell = grid[c]?.[r];
                  const isWin = winCells.has(`${c}-${r}`);
                  const isSpinningCell = spinGrid[c]?.[r];
                  return (
                    <div
                      key={r}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xl transition-all duration-150 border ${
                        isWin
                          ? "border-yellow-400 bg-yellow-500/20 shadow-[0_0_12px_rgba(245,200,66,0.6)] scale-105"
                          : "border-white/10 bg-black/30"
                      } ${isSpinningCell ? "blur-[1px] brightness-125" : ""}`}
                      style={isWin ? { borderColor: cell?.color ?? "#FFD700", boxShadow: `0 0 14px ${cell?.color ?? "#FFD700"}66` } : {}}
                    >
                      <span className={`select-none ${isSpinningCell ? "animate-spin" : ""}`} style={{ fontSize: "clamp(14px, 3vw, 22px)" }}>
                        {cell?.emoji ?? "❓"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Symbol Legend */}
        <div className="px-4 pb-3 border-t border-white/5 pt-3">
          <p className="text-[9px] text-white/30 uppercase tracking-widest mb-2">Tabel Simbol</p>
          <div className="grid grid-cols-5 gap-1">
            {SYMBOLS.slice(0, 8).map(sym => (
              <div key={sym.id} className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg bg-black/30 border border-white/5">
                <span style={{ fontSize: 16 }}>{sym.emoji}</span>
                <span className="text-[8px] text-white/40">{sym.label}</span>
                <span className="text-[8px] font-bold" style={{ color: sym.color }}>×{sym.mult[3]}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg bg-black/30 border border-yellow-500/30">
              <span style={{ fontSize: 16 }}>⭐</span>
              <span className="text-[8px] text-yellow-400">WILD</span>
              <span className="text-[8px] font-bold text-yellow-400">SUB</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg bg-black/30 border border-purple-500/30">
              <span style={{ fontSize: 16 }}>🎴</span>
              <span className="text-[8px] text-purple-400">SCAT</span>
              <span className="text-[8px] font-bold text-purple-400">FREE</span>
            </div>
          </div>
        </div>

        {/* Bet Control */}
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-3 justify-center">
            <button onClick={() => adjBet(-500)} disabled={isSpinning} className="w-10 h-10 rounded-xl bg-white/8 border border-white/15 text-[var(--neon-gold)] font-black text-2xl flex items-center justify-center hover:bg-white/15 disabled:opacity-40 transition">−</button>
            <div className="font-black text-[var(--neon-gold)] text-xl min-w-28 text-center">{fmt(bet)}</div>
            <button onClick={() => adjBet(500)} disabled={isSpinning} className="w-10 h-10 rounded-xl bg-white/8 border border-white/15 text-[var(--neon-gold)] font-black text-2xl flex items-center justify-center hover:bg-white/15 disabled:opacity-40 transition">+</button>
          </div>

          <div className="flex gap-1.5 justify-center flex-wrap">
            {[500, 1000, 5000, 10000, 25000, 50000].map(n => (
              <button key={n} onClick={() => setBet(Math.min(saldo, n))} disabled={isSpinning} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/12 text-[11px] text-white/60 hover:text-[var(--neon-gold)] hover:border-[var(--neon-gold)]/50 disabled:opacity-40 transition font-semibold">
                {n >= 1000 ? n/1000+"K" : n}
              </button>
            ))}
          </div>

          {/* SPIN BUTTON */}
          <button
            onClick={() => doSpin(false)}
            disabled={isSpinning || freeSpinsLeft > 0}
            className={`w-full font-black rounded-2xl py-5 text-2xl tracking-[0.15em] transition-all ${
              isSpinning || freeSpinsLeft > 0
                ? "bg-white/10 text-white/30 cursor-not-allowed"
                : "bg-[var(--gradient-gold)] text-white hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_30px_rgba(245,200,66,0.6)]"
            }`}
          >
            {isSpinning ? "🌀 SPINNING..." : freeSpinsLeft > 0 ? `🎴 FREE SPIN ${freeSpinsLeft}x` : "⚡ SPIN"}
          </button>
        </div>
      </div>

      {/* Paytable */}
      <div>
        <p className="text-[11px] text-white/30 uppercase tracking-widest mb-2">Paytable Ways to Win</p>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {[["5 Naga 🐉", "×500"], ["4 Naga 🐉", "×80"], ["3 Naga 🐉", "×20"], ["5 Phoenix 🦅", "×300"]].map(([label, mult]) => (
            <div key={label} className="bg-white/3 rounded-lg p-2.5 flex justify-between items-center border border-white/5">
              <span className="text-white/50">{label}</span>
              <span className="text-[var(--neon-gold)] font-bold">{mult}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-white/20 mt-2 text-center">⭐ WILD menggantikan semua simbol · 🎴 3+ SCATTER = 10 Free Spins</p>
      </div>

      {/* Win Lines */}
      {lastResult && lastResult.winLines.length > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3">
          <p className="text-[11px] text-yellow-400 font-black uppercase tracking-widest mb-2">Kombinasi Menang</p>
          <div className="space-y-1">
            {lastResult.winLines.map((line, i) => {
              const sym = SYMBOLS.find(s => s.id === line.symbol);
              return (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-white/60">{sym?.emoji} {sym?.label} ×{line.count}</span>
                  <span className="text-green-400 font-bold">+{fmt(line.winAmt)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Result */}
      {lastResult && (
        <div className={`rounded-xl border p-4 text-center ${lastResult.totalWin > 0 ? "border-green-500/50 bg-green-500/10" : "border-red-500/30 bg-red-500/5"}`}>
          <div className={`text-2xl font-black ${lastResult.totalWin > 0 ? "text-green-400" : "text-red-400"}`}>
            {lastResult.totalWin > 0 ? "+ " + fmt(lastResult.totalWin) : "- " + fmt(lastResult.bet)}
          </div>
          {lastResult.freeSpins && <div className="text-sm text-purple-400 font-bold mt-1">🎴 FREE SPINS TRIGGERED!</div>}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="border-t border-white/5 pt-4">
          <p className="text-[11px] text-white/30 uppercase tracking-widest mb-3">Riwayat Spin</p>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                <div>
                  <div className="text-[10px] text-white/30">{h.winLines.length > 0 ? h.winLines.map(l => SYMBOLS.find(s => s.id === l.symbol)?.emoji).join(" ") : "—"}</div>
                  <div className="text-[10px] text-white/30">Bet: {fmt(h.bet)}</div>
                </div>
                <div className={`font-black text-sm ${h.totalWin > 0 ? "text-green-400" : "text-red-400"}`}>
                  {h.totalWin > 0 ? "+" + fmt(h.totalWin) : "-" + fmt(h.bet)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
