import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PropLayout } from "@/components/PropLayout";
import { useBalance } from "@/hooks/useBalance";
import { useAuth } from "@/hooks/useAuth";
import { fmt } from "@/lib/utils";

export const Route = createFileRoute("/deposit")({
  component: DepositPage,
});

const AMOUNTS = [10000, 25000, 50000, 100000, 250000, 500000];

// Logo menggunakan URL resmi dari CDN Wikipedia/brand
const PAYMENT_METHODS = [
  { id: "bri",       label: "BRI",       logoUrl: "https://i0.wp.com/amanahfurniture.com/wp-content/uploads/2022/10/logo-bri.png",       type: "bank",   bg: "#003087" },
  { id: "bca",       label: "BCA",       logoUrl: "https://iconlogovector.com/uploads/images/2024/03/lg-65e77f1a0d39b-BCA-Mobile.webp", type: "bank",   bg: "#006BB6" },
  { id: "bni",       label: "BNI",       logoUrl: "https://i0.wp.com/amanahfurniture.com/wp-content/uploads/2022/10/logo-bni-46.png",                        type: "bank",   bg: "#FF6600" },
  { id: "mandiri",   label: "Mandiri",   logoUrl: "https://i.pinimg.com/474x/8a/c3/ca/8ac3ca7bd4696b766ea6fbe6004ad1bf.jpg", type: "bank", bg: "#003D99" },
  { id: "dana",      label: "DANA",      logoUrl: "https://cdn.theorg.com/912bbf16-3561-43c7-a15e-8b10efab0468_thumb.jpg",        type: "ewallet", bg: "#118EEA" },
  { id: "gopay",     label: "GoPay",     logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTU1_u4kBagPaDWERIyFFmDI8VxkzZEd4YFWQ&s",                type: "ewallet", bg: "#00880A" },
  { id: "ovo",       label: "OVO",       logoUrl: "https://pbs.twimg.com/media/EUbePLEU0AIpder.jpg",       type: "ewallet", bg: "#4C3494" },
  { id: "shopeepay", label: "ShopeePay", logoUrl: "https://images.seeklogo.com/logo-png/50/1/shopeepay-logo-png_seeklogo-504055.png",        type: "ewallet", bg: "#EE4D2D" },
  { id: "qris",      label: "QRIS",      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/QRIS_logo.svg/320px-QRIS_logo.svg.png",                  type: "qris",    bg: "#CC0000" },
];

function LogoImg({ url, label, selected }: { url: string; label: string; selected: boolean }) {
  const [err, setErr] = useState(false);
  if (err) return <span className={`text-xs font-black ${selected ? "text-[var(--neon-gold)]" : "text-white/60"}`}>{label}</span>;
  return (
    <img
      src={url}
      alt={label}
      className="h-7 w-auto object-contain mx-auto max-w-[72px]"
      style={{ filter: selected ? "none" : "brightness(0) invert(1) opacity(0.5)" }}
      onError={() => setErr(true)}
    />
  );
}

function DepositPage() {
  const { isLoggedIn } = useAuth();
  const { saldo, credit } = useBalance();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(50000);
  const [method, setMethod] = useState<string | null>(null);
  const [noRek, setNoRek] = useState("");
  const [nama, setNama] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isLoggedIn) navigate({ to: "/login" });
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  function doDeposit() {
    setErr("");
    if (!method) { setErr("Pilih metode pembayaran!"); return; }
    if (!noRek) { setErr("Masukkan nomor rekening/akun!"); return; }
    if (!nama) { setErr("Masukkan nama pengirim!"); return; }
    credit(amount);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  }

  const banks = PAYMENT_METHODS.filter(m => m.type === "bank");
  const ewallets = PAYMENT_METHODS.filter(m => m.type === "ewallet");
  const qris = PAYMENT_METHODS.filter(m => m.type === "qris");
  const selectedMethod = PAYMENT_METHODS.find(m => m.id === method);

  function PaymentGroup({ title, items }: { title: string; items: typeof PAYMENT_METHODS }) {
    return (
      <div>
        <p className="text-[10px] text-white/30 mb-2">{title}</p>
        <div className="grid grid-cols-4 gap-2">
          {items.map(m => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`py-3 px-1 rounded-xl border text-center transition-all ${
                method === m.id
                  ? "border-[var(--neon-gold)] bg-[var(--neon-gold)]/10 shadow-[0_0_12px_rgba(245,200,66,0.2)]"
                  : "border-white/10 bg-white/3 hover:border-white/25 hover:bg-white/5"
              }`}
            >
              <LogoImg url={m.logoUrl} label={m.label} selected={method === m.id} />
              <div className={`text-[9px] font-bold mt-1.5 ${method === m.id ? "text-[var(--neon-gold)]" : "text-white/40"}`}>{m.label}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PropLayout>
      <div className="max-w-md mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-black tracking-tight">💰 DEPOSIT</h1>
          <p className="text-xs text-white/30 mt-0.5">Isi Saldo Anda Untuk Mulai Bermain</p>
        </div>

        <div className="space-y-4">
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 text-center">
            <div className="text-xs text-white/40 mb-1">Saldo Saat Ini</div>
            <div className="text-2xl font-black text-[var(--neon-gold)]">{fmt(saldo)}</div>
          </div>

          {/* Pilih Nominal */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
            <p className="text-[11px] text-white/40 uppercase tracking-widest">Pilih Nominal</p>
            <div className="grid grid-cols-3 gap-2">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(a)}
                  className={`py-2.5 rounded-lg border text-sm font-bold transition-all ${
                    amount === a
                      ? "border-[var(--neon-gold)] bg-[var(--neon-gold)]/15 text-[var(--neon-gold)]"
                      : "border-white/10 bg-white/3 text-white/60 hover:border-white/20"
                  }`}
                >
                  {fmt(a).replace("Rp ", "")}
                </button>
              ))}
            </div>
            <div>
              <p className="text-[11px] text-white/40 uppercase tracking-widest mb-1.5">Atau Masukkan Manual</p>
              <input
                type="number"
                value={amount}
                min={10000}
                step={1000}
                onChange={(e) => setAmount(Math.max(10000, parseInt(e.target.value) || 10000))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-right text-[var(--neon-gold)] font-bold text-lg focus:outline-none focus:border-[var(--neon-gold)] transition"
              />
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-4">
            <p className="text-[11px] text-white/40 uppercase tracking-widest">Pilih Metode Pembayaran</p>
            <PaymentGroup title="🏦 Transfer Bank" items={banks} />
            <PaymentGroup title="📱 E-Wallet" items={ewallets} />
            <PaymentGroup title="📷 QRIS" items={qris} />
          </div>

          {/* Form detail */}
          {method && (
            <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
              <p className="text-[11px] text-white/40 uppercase tracking-widest">Detail {selectedMethod?.label}</p>
              <div>
                <label className="text-[11px] text-white/30 block mb-1">
                  {selectedMethod?.type === "bank" ? "Nomor Rekening Pengirim" :
                   selectedMethod?.type === "qris" ? "Nomor HP / ID QRIS" : "Nomor Akun Pengirim"}
                </label>
                <input
                  type="text"
                  value={noRek}
                  onChange={(e) => setNoRek(e.target.value)}
                  placeholder={selectedMethod?.type === "bank" ? "Contoh: 1234567890" : "Contoh: 08123456789"}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--neon-gold)] transition text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/30 block mb-1">Nama Pengirim</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama sesuai rekening/akun"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--neon-gold)] transition text-sm"
                />
              </div>
            </div>
          )}

          {err && <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">⚠️ {err}</div>}

          <button
            onClick={doDeposit}
            className={`w-full font-black rounded-xl py-4 text-base tracking-widest transition-all shadow-lg ${
              done
                ? "bg-green-500 text-white"
                : "bg-[var(--gradient-gold)] text-white hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
            }`}
          >
            {done ? "✓ SALDO BERHASIL DITAMBAHKAN!" : `💰 KONFIRMASI DEPOSIT ${fmt(amount)}`}
          </button>

          <p className="text-center text-[10px] text-white/20">
            ⚠️ Ini simulasi. Tidak ada uang nyata yang ditransfer.
          </p>
        </div>
      </div>
    </PropLayout>
  );
}
