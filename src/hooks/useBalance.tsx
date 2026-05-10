import { createContext, useContext, useState, type ReactNode } from "react";

interface BalanceCtx {
  saldo: number;
  setSaldo: (n: number) => void;
  deduct: (n: number) => boolean;
  credit: (n: number) => void;
}

const Ctx = createContext<BalanceCtx | null>(null);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const [saldo, setSaldo] = useState(0); // Saldo awal 0

  function deduct(n: number): boolean {
    if (n > saldo) return false;
    setSaldo((s) => s - n);
    return true;
  }

  function credit(n: number) {
    setSaldo((s) => s + n);
  }

  return <Ctx.Provider value={{ saldo, setSaldo, deduct, credit }}>{children}</Ctx.Provider>;
}

export function useBalance() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBalance must be inside BalanceProvider");
  return ctx;
}
