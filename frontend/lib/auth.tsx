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
  login: (short_id: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = async () => {
    try {
      const res = await authApi.me();
      const data = res.data;
      setUser({
        ...data,
        name: data.full_name ?? data.name ?? "Admin",
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (short_id: string, password: string) => {
  const res = await authApi.login(short_id, password);
  const data = res.data;
  const u: AuthUser = {
    ...data,
    name: data.full_name ?? data.name ?? "Admin",
  };
  setUser(u);
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