"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
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

// Idle timeout — 30 minutes in milliseconds
const IDLE_TIMEOUT = 30 * 60 * 1000;

// Silent refresh — every 14 minutes
const REFRESH_INTERVAL = 14 * 60 * 1000;

// Events that count as user activity
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router                = useRouter();

  // Refs for timers — use refs so they don't cause re-renders
  const idleTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Refresh token silently ──────────────────────────
  const refresh = useCallback(async () => {
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
  }, []);

  // ── Reset idle timer on user activity ──────────────
  const resetIdleTimer = useCallback(() => {
    // Clear existing timer
    if (idleTimer.current) clearTimeout(idleTimer.current);

    // Only set idle timer if user is logged in
    if (!user) return;

    // Set new timer — logout after 30 mins of inactivity
    idleTimer.current = setTimeout(() => {
      console.log("Idle timeout — logging out");
      logout();
    }, IDLE_TIMEOUT);
  }, [user]);

  // ── Start silent token refresh interval ────────────
  const startRefreshInterval = useCallback(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(async () => {
      try {
        await authApi.me();
      } catch {
        // Token expired — redirect to login
        setUser(null);
        router.push("/login");
      }
    }, REFRESH_INTERVAL);
  }, [router]);

  // ── Initial auth check on mount ────────────────────
  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Setup activity listeners when user logs in ──────
  useEffect(() => {
    if (!user) {
      // Clean up timers when logged out
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      ACTIVITY_EVENTS.forEach(e =>
        window.removeEventListener(e, resetIdleTimer)
      );
      return;
    }

    // User is logged in — start timers
    resetIdleTimer();
    startRefreshInterval();

    // Listen for activity
    ACTIVITY_EVENTS.forEach(e =>
      window.addEventListener(e, resetIdleTimer, { passive: true })
    );

    return () => {
      // Cleanup on unmount
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      ACTIVITY_EVENTS.forEach(e =>
        window.removeEventListener(e, resetIdleTimer)
      );
    };
  }, [user, resetIdleTimer, startRefreshInterval]);

  // ── Login ───────────────────────────────────────────
  const login = async (short_id: string, password: string) => {
    const res = await authApi.login(short_id, password);
    const data = res.data;
    const u: AuthUser = {
      ...data,
      name: data.full_name ?? data.name ?? "Admin",
    };
    setUser(u);
    if (u.force_password_reset) {
      router.push("/login?reset=1");
    } else {
      router.push("/");
    }
  };

  // ── Logout ──────────────────────────────────────────
  const logout = async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (refreshTimer.current) clearInterval(refreshTimer.current);
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
        isAdmin: user?.role === "ADM" || user?.role === "SAD"
          || user?.role === ("admin" as UserRole)
          || user?.role === ("super_admin" as UserRole),
        isSuperAdmin: user?.role === "SAD"
          || user?.role === ("super_admin" as UserRole),
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