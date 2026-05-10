import { createContext, useContext, useState, type ReactNode } from "react";

interface User {
  username: string;
  displayName: string;
}

interface AuthCtx {
  user: User | null;
  login: (username: string, password: string) => boolean;
  register: (username: string, password: string, displayName: string) => { ok: boolean; msg: string };
  logout: () => void;
  isLoggedIn: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

const SEED_ACCOUNTS: Record<string, { password: string; displayName: string }> = {
  demo: { password: "demo123", displayName: "Demo User" },
  admin: { password: "admin123", displayName: "Admin" },
  user1: { password: "pass123", displayName: "Member VIP" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Record<string, { password: string; displayName: string }>>(SEED_ACCOUNTS);

  function login(username: string, password: string): boolean {
    const acc = accounts[username.toLowerCase()];
    if (acc && acc.password === password) {
      setUser({ username: username.toLowerCase(), displayName: acc.displayName });
      return true;
    }
    return false;
  }

  function register(username: string, password: string, displayName: string): { ok: boolean; msg: string } {
    const key = username.toLowerCase();
    if (!username || username.length < 3) return { ok: false, msg: "Username minimal 3 karakter!" };
    if (!password || password.length < 6) return { ok: false, msg: "Password minimal 6 karakter!" };
    if (!displayName) return { ok: false, msg: "Nama tampilan wajib diisi!" };
    if (accounts[key]) return { ok: false, msg: "Username sudah digunakan!" };
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return { ok: false, msg: "Username hanya boleh huruf, angka, dan underscore!" };

    const newAccounts = { ...accounts, [key]: { password, displayName } };
    setAccounts(newAccounts);
    setUser({ username: key, displayName });
    return { ok: true, msg: "Akun berhasil dibuat!" };
  }

  function logout() {
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, login, register, logout, isLoggedIn: !!user }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
