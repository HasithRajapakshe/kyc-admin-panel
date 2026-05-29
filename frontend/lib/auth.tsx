"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "./api";

export type UserRole = "USR" | "ADM" | "SAD";

export interface AuthUser {
  employee_id: string;
  short_id: string;
  name: string;
  full_name?: string;
  email: string;
  role: UserRole;
  branch: string;
  force_password_reset: boolean;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (employee_id: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const refresh = async () => {
    try {
      const res = await authApi.me();
      setUser(res.data);
    } catch {
      setUser(null);
    }
  };

  const login = async (short_id: string, password: string) => {
    const res = await authApi.login(short_id, password);
    const u: AuthUser = {
  ...res.data,
  name: res.data.full_name ?? res.data.name ?? "Admin",
};
    setUser(u);
    if (u.force_password_reset) {
      router.push("/login?reset=1");
    } else {
      router.push("/");
    }
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
    router.push("/login");
  };

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refresh,
        isAdmin: user?.role === "ADM" || user?.role === "SAD",
        isSuperAdmin: user?.role === "SAD",
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}