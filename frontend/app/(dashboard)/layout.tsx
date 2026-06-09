"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  ShieldAlert,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/watchlist", label: "Watchlist", icon: ShieldAlert },
  { href: "/users", label: "User Management", icon: Users },
];

const ROLE_DISPLAY: Record<string, string> = {
  USR: "KYC Officer",
  ADM: "Admin",
  SAD: "Super Admin",
  user: "KYC Officer",
  admin: "Admin",
  super_admin: "Super Admin",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Show spinner while loading auth
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F4F6FA",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid #F5A800",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  // Not logged in — show nothing, auth.tsx handles redirect
  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F4F6FA",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid #F5A800",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-LK", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const SidebarContent = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#0A1628",
      }}
    >
      <div
        style={{
          height: 4,
          background: "linear-gradient(90deg, #F5A800, #C98B00)",
          flexShrink: 0,
        }}
      />
      <div
        style={{
          padding: "18px 18px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "linear-gradient(135deg, #F5A800, #C98B00)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: "#0A1628",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              B
            </span>
          </div>
          <div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 18,
                color: "#fff",
                fontFamily: "Poppins, sans-serif",
                lineHeight: 1,
              }}
            >
              Bank of Ceylon
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#F5A800",
                letterSpacing: 1.5,
                textTransform: "uppercase",
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              KYC Admin Portal
            </div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                textDecoration: "none",
                display: "block",
                marginBottom: 2,
              }}
              onClick={() => setMobileOpen(false)}
            >
              <div className={`nav-item${active ? " active" : ""}`}>
                <item.icon size={18} style={{ flexShrink: 0 }} />
                {item.label}
                {active && (
                  <ChevronRight size={12} style={{ marginLeft: "auto" }} />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          padding: "10px 8px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.05)",
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#F5A800",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#0A1628",
              flexShrink: 0,
            }}
          >
            {user.name?.charAt(0) ?? "A"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#E2E8F0",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.name}
            </div>
            <div
              style={{ fontSize: 12, color: "#F5A800", fontWeight: 600 }}
            >
              {ROLE_DISPLAY[user.role] ?? user.role}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="nav-item"
          style={{ color: "#F87171", width: "100%" }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#F4F6FA",
      }}
    >
      <aside
        className="hidden md:flex"
        style={{
          width: 280,
          flexShrink: 0,
          flexDirection: "column",
        }}
      >
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
            }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="flex md:hidden"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 280,
              zIndex: 60,
              flexDirection: "column",
            }}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <header
          style={{
            height: 56,
            background: "#fff",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94A3B8",
              padding: 4,
              display: "flex",
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span style={{ fontSize: 14, color: "#94A3B8" }}>
            🕐 {today}
          </span>
          <span style={{ color: "#E2E8F0" }}>|</span>
          <span
            style={{
              background: "#DCFCE7",
              color: "#166534",
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            ● System Online
          </span>
          <span
            style={{
              background: "#F1F5F9",
              color: "#334155",
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              border: "1px solid #E2E8F0",
            }}
          >
            FIU-SL Compliant
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 14, color: "#94A3B8" }}>
            {user.branch}
          </span>
        </header>

        <main style={{ flex: 1, overflowY: "auto", padding: 26, position: "relative", display: "flex", flexDirection: "column" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage: "url('/boclogo.jpg')",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: "50%",
              opacity: 0.04,
              zIndex: 0,
            }}
          />
          <div style={{ position: "relative", zIndex: 1, flex: 1, marginBottom: 24 }}>
            {children}
          </div>

          {mounted && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: 14,
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                position: "relative",
                zIndex: 1,
                marginTop: "auto",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #F5A800, #C98B00)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 26 }}>🏦</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1, flexWrap: "wrap" }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0A1628",
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  Bank of Ceylon — KYC Admin
                </div>

                <div style={{ width: 1, height: 16, background: "#E2E8F0" }} />

                <div style={{ fontSize: 14, color: "#64748B", fontWeight: 500 }}>
                  CBSL & FIU-SL Compliant
                </div>

                <div style={{ flex: 1 }} />

                <div style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>
                  Updated: {currentTime}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}