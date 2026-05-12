import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Register state
  const [regUser, setRegUser] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regPass2, setRegPass2] = useState("");
  const [regName, setRegName] = useState("");
  const [showRegPass, setShowRegPass] = useState(false);
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  function doLogin() {
    setError("");
    if (!username || !password) { setError("Username dan password wajib diisi!"); return; }
    setLoading(true);
    setTimeout(() => {
      const ok = login(username, password);
      if (ok) { navigate({ to: "/" }); }
      else { setError("Username atau password salah!"); setLoading(false); }
    }, 800);
  }

  function doRegister() {
    setRegError("");
    if (regPass !== regPass2) { setRegError("Password konfirmasi tidak cocok!"); return; }
    setRegLoading(true);
    setTimeout(() => {
      const res = register(regUser, regPass, regName);
      if (res.ok) { navigate({ to: "/" }); }
      else { setRegError(res.msg); setRegLoading(false); }
    }, 800);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") tab === "login" ? doLogin() : doRegister();
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[340px] h-[340px] rounded-full bg-[var(--neon-gold)]/5 blur-[80px]" />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center">
        <span className="text-[80px] font-black uppercase tracking-widest opacity-[0.03] rotate-[-25deg] select-none text-white">
          FICTIONAL
        </span>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex size-20 items-center justify-center mb-3 drop-shadow-[0_0_16px_rgba(245,200,66,0.7)]">
            <img src="/logo.svg" alt="WISNUX88 Logo" className="w-full h-full" />
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#FFE066] via-[#F5C842] to-[#C49A1A] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(245,200,66,0.5)]">
            TOGEL<span className="text-[#FFD700]">X99</span>
          </h1>
          <p className="text-xs text-white/30 mt-1">Platform Judi Online Terpercaya</p>
        </div>

        {/* Tab Switch */}
        <div className="flex mb-4 bg-white/5 border border-white/10 rounded-xl p-1">
          <button
            onClick={() => { setTab("login"); setError(""); }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-black tracking-widest transition-all ${tab === "login" ? "bg-[var(--gradient-gold)] text-black" : "text-white/40 hover:text-white/70"}`}
          >
            🔐 MASUK
          </button>
          <button
            onClick={() => { setTab("register"); setRegError(""); }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-black tracking-widest transition-all ${tab === "register" ? "bg-[var(--gradient-gold)] text-black" : "text-white/40 hover:text-white/70"}`}
          >
            📝 DAFTAR
          </button>
        </div>

        {/* Card */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-4 backdrop-blur">
          {tab === "login" ? (
            <>
              <div>
                <label className="text-[11px] text-white/40 uppercase tracking-widest block mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--neon-gold)] transition text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/40 uppercase tracking-widest block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--neon-gold)] transition text-sm"
                  />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition text-sm">
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-xs">⚠️ {error}</div>}
              <button
                onClick={doLogin}
                disabled={loading}
                className="w-full bg-[var(--gradient-gold)] text-black font-black rounded-xl py-3.5 text-sm tracking-widest hover:opacity-90 disabled:opacity-60 transition-all"
              >
                {loading ? "⏳ MEMPROSES..." : "🔐 MASUK"}
              </button>
              {/* Demo hints */}
              <div className="bg-white/3 border border-white/5 rounded-xl p-3">
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Akun Demo</p>
                <div className="space-y-1">
                  {[{ u: "demo", p: "demo123" }, { u: "admin", p: "admin123" }, { u: "user1", p: "pass123" }].map((acc) => (
                    <button key={acc.u} onClick={() => { setUsername(acc.u); setPassword(acc.p); }} className="w-full flex justify-between items-center px-2 py-1 rounded-lg hover:bg-white/5 transition text-left">
                      <span className="text-[11px] text-[var(--neon-gold)] font-bold">{acc.u}</span>
                      <span className="text-[10px] text-white/30">{acc.p}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-[11px] text-white/40 uppercase tracking-widest block mb-1.5">Nama Tampilan</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Nama kamu (misal: Budi)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--neon-gold)] transition text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/40 uppercase tracking-widest block mb-1.5">Username</label>
                <input
                  type="text"
                  value={regUser}
                  onChange={(e) => setRegUser(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Min. 3 karakter, tanpa spasi"
                  autoComplete="username"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--neon-gold)] transition text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/40 uppercase tracking-widest block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showRegPass ? "text" : "password"}
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Min. 6 karakter"
                    autoComplete="new-password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--neon-gold)] transition text-sm"
                  />
                  <button onClick={() => setShowRegPass(!showRegPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition text-sm">
                    {showRegPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-white/40 uppercase tracking-widest block mb-1.5">Konfirmasi Password</label>
                <input
                  type="password"
                  value={regPass2}
                  onChange={(e) => setRegPass2(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--neon-gold)] transition text-sm"
                />
              </div>
              {regError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-xs">⚠️ {regError}</div>}
              <button
                onClick={doRegister}
                disabled={regLoading}
                className="w-full bg-[var(--gradient-gold)] text-black font-black rounded-xl py-3.5 text-sm tracking-widest hover:opacity-90 disabled:opacity-60 transition-all"
              >
                {regLoading ? "⏳ MENDAFTARKAN..." : "✨ BUAT AKUN SEKARANG"}
              </button>
              <p className="text-center text-[10px] text-white/30">Sudah punya akun? <button onClick={() => setTab("login")} className="text-[var(--neon-gold)] underline">Masuk di sini</button></p>
            </>
          )}
        </div>

        <p className="text-center text-[10px] text-white/20 mt-4">
          Masuk dan Raih Puluhan Juta Rupiah.
        </p>
      </div>
    </div>
  );
}
