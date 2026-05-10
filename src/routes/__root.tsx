import { createRootRoute, Outlet } from "@tanstack/react-router";
import { BalanceProvider } from "@/hooks/useBalance";
import { AuthProvider } from "@/hooks/useAuth";

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <BalanceProvider>
        <Outlet />
      </BalanceProvider>
    </AuthProvider>
  ),
});
