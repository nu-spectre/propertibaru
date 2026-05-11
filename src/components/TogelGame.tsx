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

const FREE_WIN_QUOTA = 10;

const RUMUS_TABS = ["Ekor Mati", "Kepala Mati", "Shio", "Colok Jitu", "Angka Main", "Rumus AS"];

const RUMUS_EKOR = [
  { as: "0", ekor_mati: "5 6 7 8 9" },
  { as: "1", ekor_mati: "6 7 8 9 0" },
  { as: "2", ekor_mati: "7 8 9 0 1" },
  { as: "3", ekor_mati: "8 9 0 1 2" },
  { as: "4", ekor_mati: "9 0 1 2 3" },
  { as: "5", ekor_mati: "0 1 2 3 4" },
  { as: "6", ekor_mati: "1 2 3 4 5" },
  { as: "7", ekor_mati: "2 3 4 5 6" },
  { as: "8", ekor_mati: "3 4 5 6 7" },
  { as: "9", ekor_mati: "4 5 6 7 8" },
];

const RUMUS_KEPALA = [
  { ekor: "0", kepala_mati: "1 3 5 7 9" },
  { ekor: "1", kepala_mati: "2 4 6 8 0" },
  { ekor: "2", kepala_mati: "3 5 7 9 1" },
  { ekor: "3", kepala_mati: "4 6 8 0 2" },
  { ekor: "4", kepala_mati: "5 7 9 1 3" },
  { ekor: "5", kepala_mati: "6 8 0 2 4" },
  { ekor: "6", kepala_mati: "7 9 1 3 5" },
  { ekor: "7", kepala_mati: "8 0 2 4 6" },
  { ekor: "8", kepala_mati: "9 1 3 5 7" },
  { ekor: "9", kepala_mati: "0 2 4 6 8" },
];

const RUMUS_SHIO = [
  { shio: "🐀 Tikus", angka: "1 13 25 37 49 61 73 85 97" },
  { shio: "🐂 Kerbau", angka: "2 14 26 38 50 62 74 86 98" },
  { shio: "🐅 Macan", angka: "3 15 27 39 51 63 75 87 99" },
  { shio: "🐇 Kelinci", angka: "4 16 28 40 52 64 76 88 00" },
  { shio: "🐉 Naga", angka: "5 17 29 41 53 65 77 89" },
  { shio: "🐍 Ular", angka: "6 18 30 42 54 66 78 90" },
  { shio: "🐴 Kuda", angka: "7 19 31 43 55 67 79 91" },
  { shio: "🐑 Kambing", angka: "8 20 32 44 56 68 80 92" },
  { shio: "🐒 Monyet", angka: "9 21 33 45 57 69 81 93" },
  { shio: "🐓 Ayam", angka: "10 22 34 46 58 70 82 94" },
  { shio: "🐕 Anjing", angka: "11 23 35 47 59 71 83 95" },
  { shio: "🐖 Babi", angka: "12 24 36 48 60 72 84 96" },
];

const RUMUS_COLOK = [
  { kode: "AS + KOP", rumus: "AS × 1 + KOP × 2 = Angka Main" },
  { kode: "KOP + KEP", rumus: "KOP + KEP ÷ 2 = Colok Jitu" },
  { kode: "KEP + EKR", rumus: "KEP + EKR = Angka Ikut" },
  { kode: "Total 4D", rumus: "AS+KOP+KEP+EKR mod 10 = Angka Bonus" },
];

const RUMUS_ANGKA_MAIN = [
  { formula: "Rumus A", keterangan: "(KEP + EKR) × 2 mod 10", contoh: "Jika KEP=3, EKR=7 → (3+7)×2=20 → angka main: 0" },
  { formula: "Rumus B", keterangan: "AS + KOP - 1 mod 10", contoh: "Jika AS=4, KOP=6 → 4+6-1=9 → angka main: 9" },
  { formula: "Rumus C", keterangan: "(AS × KOP) mod 10", contoh: "Jika AS=2, KOP=5 → 2×5=10 → angka main: 0" },
  { formula: "Rumus D", keterangan: "EKR + 5 mod 10", contoh: "Jika EKR=8 → 8+5=13 → angka main: 3" },
];

const RUMUS_AS_DATA = [
  { hasil: "0", as_keluar: "1 2 3" },
  { hasil: "1", as_keluar: "4 5 6" },
  { hasil: "2", as_keluar: "7 8 9" },
  { hasil: "3", as_keluar: "0 1 2" },
  { hasil: "4", as_keluar: "3 4 5" },
  { hasil: "5", as_keluar: "6 7 8" },
  { hasil: "6", as_keluar: "9 0 1" },
  { hasil: "7", as_keluar: "2 3 4" },
  { hasil: "8", as_keluar: "5 6 7" },
  { hasil: "9", as_keluar: "8 9 0" },
];

export function TogelGame() {
  const { saldo, deduct, credit } = useBalance();

  const [pasaran, setPasaran] = useState(PASARANS[0]);
  const [betType, setBetType] = useState(BET_TYPES[0]);
  const [nomor, setNomor] = useState("");
  const [betAmt, setBetAmt] = useState(1000);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lastResult, setLastResult] = useState<HistoryItem | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [rollingText, setRollingText] = useState("Mengundi nomor...");
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winPopupAmt, setWinPopupAmt] = useState(0);
  const [activeRumusTab, setActiveRumusTab] = useState(0);
  const [showRumus, setShowRumus] = useState(true);

  const playCountRef = useRef(0);

  function randomNomor() {
    let n = "";
    for (let i = 0; i < betType.digits; i++) n += Math.floor(Math.random() * 10);
    setNomor(n);
  }

  function handleNomorChange(v: string) {
    setNomor(v.replace(/[^0-9]/g, "").slice(0, betType.digits));
  }

  function addBet(n: number) {
    setBetAmt((prev) => Math.min(saldo, prev + n));
  }

  function generateResult(userNomor: string, digits: number, forceWin: boolean): string {
    if (forceWin) return userNomor;
    let result = "";
    let attempts = 0;
    do {
      result = "";
      for (let i = 0; i < digits; i++) result += Math.floor(Math.random() * 10);
      attempts++;
    } while (result === userNomor && attempts < 50);
    return result;
  }

  function pasang() {
    if (nomor.length < betType.digits) { alert("Masukkan " + betType.digits + " digit nomor!"); return; }
    if (betAmt < 500) { alert("Minimal bet Rp 500!"); return; }
    if (!deduct(betAmt)) { alert("Saldo tidak cukup!"); return; }

    setIsRolling(true);
    setLastResult(null);

    const texts = ["Mengundi nomor...", "Menyiapkan result...", "Mencocokkan angka...", "Menunggu pasaran...", "Hampir selesai..."];
    let textIndex = 0;
    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % texts.length;
      setRollingText(texts[textIndex]);
    }, 2000);

    const delay = 3000 + Math.floor(Math.random() * 7000);

    setTimeout(() => {
      clearInterval(textInterval);
      playCountRef.current += 1;
      const count = playCountRef.current;
      const forceWin = count <= FREE_WIN_QUOTA ? true : Math.random() < 0.09;

      const resultNum = generateResult(nomor, betType.digits, forceWin);
      const win = resultNum === nomor;
      const winAmt = win ? betAmt * betType.mult : 0;
      if (win) credit(winAmt);

      const item: HistoryItem = { nomor, result: resultNum, bet: betAmt, pasaran: pasaran.code, type: betType.label, win, winAmt };
      setLastResult(item);
      setHistory((h) => [item, ...h].slice(0, 8));
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 400);
      setIsRolling(false);

      if (win && winAmt > 0) {
        setWinPopupAmt(winAmt);
        setShowWinPopup(true);
      }
    }, delay);
  }

  const isReady = nomor.length >= betType.digits && betAmt >= 500;
  const remainingFreeWins = Math.max(0, FREE_WIN_QUOTA - playCountRef.current);

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* WIN POPUP */}
      {showWinPopup && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowWinPopup(false)}
        >
          <style>{`
            @keyframes popIn { from { transform: scale(0.3) rotate(-10deg); opacity: 0; } to { transform: scale(1) rotate(0deg); opacity: 1; } }
            @keyframes floatCoin { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
            .win-popup { animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
          `}</style>
          <div
            className="win-popup relative mx-4 max-w-sm w-full rounded-3xl border-4 border-yellow-400 bg-gradient-to-b from-yellow-900 via-black to-yellow-900 p-8 text-center shadow-[0_0_80px_rgba(245,200,66,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-6xl mb-2 animate-bounce">🎉</div>
            <div className="text-2xl font-black text-yellow-300 tracking-widest mb-1">SELAMAT!</div>
            <div className="text-sm text-white/60 mb-4">NOMOR KAMU TEMBUS!</div>
            <div className="text-5xl font-black text-yellow-400 mb-1" style={{ textShadow: "0 0 30px rgba(245,200,66,0.8)" }}>
              {fmt(winPopupAmt)}
            </div>
            <div className="text-xs text-white/40 mb-6">Kemenangan telah dikreditkan ke saldo kamu</div>
            <button
              onClick={() => setShowWinPopup(false)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-300 text-black font-black text-lg tracking-widest hover:opacity-90 transition"
            >
              KLAIM 🏆
            </button>
            <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-yellow-400 animate-ping"></div>
            <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-yellow-400 animate-ping" style={{animationDelay:"0.15s"}}></div>
            <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-yellow-400 animate-ping" style={{animationDelay:"0.3s"}}></div>
            <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-yellow-400 animate-ping" style={{animationDelay:"0.5s"}}></div>
          </div>
        </div>
      )}

      {remainingFreeWins > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🎁</span>
          <div>
            <div className="text-xs font-black text-yellow-400 tracking-wide">BONUS MEMBER BARU!</div>
            <div className="text-[11px] text-white/60">{remainingFreeWins} permainan lagi dijamin menang! (dari 10)</div>
          </div>
        </div>
      )}

      {/* RUMUS TOGEL SECTION */}
      <div className="rounded-xl border border-yellow-500/30 bg-black/40 overflow-hidden">
        <button
          onClick={() => setShowRumus(!showRumus)}
          className="w-full flex items-center justify-between px-4 py-3 bg-yellow-500/10 hover:bg-yellow-500/15 transition"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">📐</span>
            <span className="font-black text-yellow-400 tracking-wide text-sm">RUMUS & PREDIKSI TOGEL</span>
          </div>
          <span className="text-yellow-400 text-xs">{showRumus ? "▲ Sembunyikan" : "▼ Tampilkan"}</span>
        </button>

        {showRumus && (
          <div className="p-4">
            <div className="flex gap-1 flex-wrap mb-4">
              {RUMUS_TABS.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveRumusTab(i)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeRumusTab === i ? "bg-yellow-500 text-black" : "bg-white/5 border border-white/10 text-white/50 hover:text-yellow-400"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeRumusTab === 0 && (
              <div>
                <p className="text-[11px] text-white/40 mb-3">📌 Lihat angka <span className="text-yellow-400 font-bold">AS</span> dari result sebelumnya → prediksi <span className="text-yellow-400 font-bold">EKOR MATI</span></p>
                <div className="overflow-auto rounded-lg border border-white/10">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-yellow-500/20"><th className="px-3 py-2 text-left text-yellow-400 font-black">AS</th><th className="px-3 py-2 text-left text-yellow-400 font-black">Ekor Mati</th></tr></thead>
                    <tbody>{RUMUS_EKOR.map((row) => (<tr key={row.as} className="border-t border-white/5 hover:bg-white/3"><td className="px-3 py-2 font-bold text-white">{row.as}</td><td className="px-3 py-2 text-white/70 tracking-widest">{row.ekor_mati}</td></tr>))}</tbody>
                  </table>
                </div>
                <p className="text-[10px] text-white/30 mt-2">*Ekor mati = angka yang kemungkinan kecil keluar sebagai ekor</p>
              </div>
            )}

            {activeRumusTab === 1 && (
              <div>
                <p className="text-[11px] text-white/40 mb-3">📌 Lihat angka <span className="text-yellow-400 font-bold">EKOR</span> dari result → prediksi <span className="text-yellow-400 font-bold">KEPALA MATI</span></p>
                <div className="overflow-auto rounded-lg border border-white/10">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-yellow-500/20"><th className="px-3 py-2 text-left text-yellow-400 font-black">Ekor</th><th className="px-3 py-2 text-left text-yellow-400 font-black">Kepala Mati</th></tr></thead>
                    <tbody>{RUMUS_KEPALA.map((row) => (<tr key={row.ekor} className="border-t border-white/5 hover:bg-white/3"><td className="px-3 py-2 font-bold text-white">{row.ekor}</td><td className="px-3 py-2 text-white/70 tracking-widest">{row.kepala_mati}</td></tr>))}</tbody>
                  </table>
                </div>
              </div>
            )}

            {activeRumusTab === 2 && (
              <div>
                <p className="text-[11px] text-white/40 mb-3">📌 <span className="text-yellow-400 font-bold">Shio</span> berdasarkan 2 angka ekor result</p>
                <div className="grid grid-cols-1 gap-1">
                  {RUMUS_SHIO.map((row) => (<div key={row.shio} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/3 border border-white/5 hover:bg-white/5"><span className="text-base w-24 shrink-0 font-bold text-white/80">{row.shio}</span><span className="text-[11px] text-white/50 tracking-widest">{row.angka}</span></div>))}
                </div>
              </div>
            )}

            {activeRumusTab === 3 && (
              <div>
                <p className="text-[11px] text-white/40 mb-3">📌 Rumus <span className="text-yellow-400 font-bold">Colok Jitu</span> — hitung dari posisi AS, KOP, KEP, EKR</p>
                <div className="space-y-2">
                  {RUMUS_COLOK.map((row) => (<div key={row.kode} className="px-4 py-3 rounded-lg bg-white/3 border border-white/10"><div className="text-xs font-black text-yellow-400 mb-1">{row.kode}</div><div className="text-sm font-mono text-white/80">{row.rumus}</div></div>))}
                </div>
                <div className="mt-3 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-[11px] text-white/50">
                  💡 AS = Angka pertama · KOP = Angka kedua · KEP = Angka ketiga · EKR = Angka keempat (ekor)
                </div>
              </div>
            )}

            {activeRumusTab === 4 && (
              <div>
                <p className="text-[11px] text-white/40 mb-3">📌 <span className="text-yellow-400 font-bold">Angka Main</span> — formula prediksi angka terkuat</p>
                <div className="space-y-3">
                  {RUMUS_ANGKA_MAIN.map((row) => (<div key={row.formula} className="px-4 py-3 rounded-lg bg-white/3 border border-white/10"><div className="flex items-center gap-2 mb-1"><span className="text-[10px] bg-yellow-500 text-black font-black px-2 py-0.5 rounded">{row.formula}</span><span className="text-xs font-mono text-yellow-300">{row.keterangan}</span></div><div className="text-[11px] text-white/40">{row.contoh}</div></div>))}
                </div>
              </div>
            )}

            {activeRumusTab === 5 && (
              <div>
                <p className="text-[11px] text-white/40 mb-3">📌 Prediksi <span className="text-yellow-400 font-bold">AS</span> berdasarkan jumlah digit result sebelumnya</p>
                <div className="overflow-auto rounded-lg border border-white/10">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-yellow-500/20"><th className="px-3 py-2 text-left text-yellow-400 font-black">Hasil (mod 10)</th><th className="px-3 py-2 text-left text-yellow-400 font-black">AS Kemungkinan Keluar</th></tr></thead>
                    <tbody>{RUMUS_AS_DATA.map((row) => (<tr key={row.hasil} className="border-t border-white/5 hover:bg-white/3"><td className="px-3 py-2 font-bold text-white">{row.hasil}</td><td className="px-3 py-2 text-white/70 tracking-widest">{row.as_keluar}</td></tr>))}</tbody>
                  </table>
                </div>
                <p className="text-[10px] text-white/30 mt-2">*Jumlahkan semua digit result terakhir, ambil mod 10</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pasaran */}
      <div>
        <p className="text-[11px] text-white/40 uppercase tracking-widest mb-2">Pilih Pasaran</p>
        <div className="grid grid-cols-3 gap-2">
          {PASARANS.map((p) => (
            <button key={p.code} onClick={() => setPasaran(p)} className={`rounded-lg border py-2 px-1 text-center transition-all ${pasaran.code === p.code ? "border-[var(--neon-gold)] bg-[var(--neon-gold)]/10" : "border-white/10 bg-white/3 hover:border-white/20"}`}>
              <div className="text-xs font-bold">{p.name}</div>
              <div className="text-[10px] text-white/40">{p.time}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Bet Type */}
      <div>
        <p className="text-[11px] text-white/40 uppercase tracking-widest mb-2">Jenis Pasang</p>
        <div className="grid grid-cols-4 gap-2">
          {BET_TYPES.map((bt) => (
            <button key={bt.label} onClick={() => { setBetType(bt); setNomor(""); }} className={`rounded-lg border py-2 text-center text-xs transition-all ${betType.label === bt.label ? "border-[var(--neon-gold)] bg-[var(--neon-gold)]/10 text-[var(--neon-gold)]" : "border-white/10 bg-white/3 text-white/60 hover:border-white/20"}`}>
              <div className="font-bold">{bt.label}</div>
              <div className="text-[10px] text-[var(--neon-gold)]/70">{bt.short}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Nomor Input */}
      <div>
        <p className="text-[11px] text-white/40 uppercase tracking-widest mb-2">Nomor Pilihan</p>
        <input value={nomor} onChange={(e) => handleNomorChange(e.target.value)} maxLength={betType.digits} placeholder={"─".repeat(betType.digits)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center text-3xl font-bold tracking-[0.5em] text-[var(--neon-gold)] focus:outline-none focus:border-[var(--neon-gold)] transition" />
        <div className="flex gap-2 mt-2 flex-wrap">
          <span className="text-[11px] text-white/30 self-center">Quick:</span>
          {["1234", "5678", "0000", "8888"].map((n) => (<button key={n} onClick={() => setNomor(n.slice(0, betType.digits))} className="px-3 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/50 hover:text-[var(--neon-gold)] hover:border-[var(--neon-gold)]/50 transition">{n.slice(0, betType.digits)}</button>))}
          <button onClick={randomNomor} className="px-3 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/50 hover:text-[var(--neon-gold)] hover:border-[var(--neon-gold)]/50 transition">🎲 Acak</button>
        </div>
      </div>

      {/* Info */}
      <div className="flex justify-between bg-white/3 border border-white/5 rounded-lg px-4 py-2.5 text-xs">
        <span className="text-white/40">Pasaran: <span className="text-[var(--neon-gold)] font-bold">{pasaran.code}</span></span>
        <span className="text-white/40">Jenis: <span className="text-[var(--neon-gold)] font-bold">{betType.label}</span></span>
        <span className="text-white/40">Bayar: <span className="text-[var(--neon-gold)] font-bold">{betType.short}</span></span>
      </div>

      {/* Bet Amount */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[11px] text-white/40 uppercase tracking-widest">Nominal Bet</span>
          <input type="number" value={betAmt} min={500} step={500} onChange={(e) => setBetAmt(Math.max(500, Math.min(saldo, parseInt(e.target.value) || 500)))} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-right text-[var(--neon-gold)] font-bold text-lg focus:outline-none focus:border-[var(--neon-gold)] transition" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[1000, 5000, 10000, 50000, 100000].map((n) => (<button key={n} onClick={() => addBet(n)} className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-white/50 hover:text-[var(--neon-gold)] hover:border-[var(--neon-gold)]/50 transition">+{n >= 1000 ? n/1000+"rb" : n}</button>))}
          <button onClick={() => setBetAmt(saldo)} className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-white/50 hover:text-[var(--neon-gold)] hover:border-[var(--neon-gold)]/50 transition">MAX</button>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-white/40">Potensi menang:</span>
        <span className="text-[var(--neon-gold)] font-bold text-lg">{fmt(betAmt * betType.mult)}</span>
      </div>

      <button onClick={pasang} disabled={!isReady || isRolling} className={`w-full font-black rounded-2xl py-5 text-xl tracking-widest transition-all shadow-xl ${isReady && !isRolling ? "bg-[var(--gradient-gold)] text-white hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_30px_rgba(245,200,66,0.5)]" : "bg-white/10 text-white/25 cursor-not-allowed"}`}>
        {isRolling ? "⏳ MENUNGGU HASIL..." : isReady ? "🎯 PASANG TOGEL" : "Lengkapi nomor & nominal"}
      </button>

      {isRolling && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center animate-pulse">
          <div className="text-5xl mb-3">🎰</div>
          <div className="text-lg font-black text-[var(--neon-gold)] tracking-widest">{rollingText}</div>
          <div className="text-xs text-white/40 mt-2">Harap tunggu hasil pasaran...</div>
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce" style={{animationDelay:"0.1s"}}></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce" style={{animationDelay:"0.2s"}}></div>
          </div>
        </div>
      )}

      {lastResult && (
        <div className={`rounded-xl border p-4 text-center transition-all ${lastResult.win ? "border-green-500/50 bg-green-500/10" : "border-red-500/30 bg-red-500/5"} ${isAnimating ? "scale-105" : "scale-100"}`}>
          <div className="text-xs text-white/40 mb-1">Nomor keluar: <span className="font-black text-[var(--neon-gold)] tracking-widest">{lastResult.result}</span></div>
          <div className={`text-2xl font-black ${lastResult.win ? "text-green-400" : "text-red-400"}`}>{lastResult.win ? "+ " + fmt(lastResult.winAmt) : "- " + fmt(lastResult.bet)}</div>
          <div className="text-xs text-white/40 mt-1">{lastResult.win ? "🎉 SELAMAT! Nomor kamu TEMBUS!" : "😔 Belum beruntung. Coba lagi!"}</div>
        </div>
      )}

      {history.length > 0 && (
        <div className="border-t border-white/5 pt-4">
          <p className="text-[11px] text-white/30 uppercase tracking-widest mb-3">Riwayat Pasang</p>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                <div>
                  <div className="font-bold tracking-widest text-sm">{h.nomor} → {h.result}</div>
                  <div className="text-[10px] text-white/30">{h.pasaran} · {h.type} · {fmt(h.bet)}</div>
                </div>
                <div className={`font-black text-sm ${h.win ? "text-green-400" : "text-red-400"}`}>{h.win ? "+" + fmt(h.winAmt) : "-" + fmt(h.bet)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
