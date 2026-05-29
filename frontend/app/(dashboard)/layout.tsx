"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
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
import { ROLE_LABELS } from "@/lib/utils";

const NAV = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["USR", "ADM", "SAD"],
  },
  {
    href: "/applications",
    label: "Applications",
    icon: FileText,
    roles: ["USR", "ADM", "SAD"],
    badge: true,
  },
  {
    href: "/watchlist",
    label: "Watchlist",
    icon: ShieldAlert,
    roles: ["USR", "ADM", "SAD"],
  },
  {
    href: "/users",
    label: "User Management",
    icon: Users,
    roles: ["SAD"],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Loading spinner
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

  // Not logged in
  if (!user) {
    router.replace("/login");
    return null;
  }

  // Force password reset
  if (user.force_password_reset) {
    router.replace("/login?reset=1");
    return null;
  }

  const filtered = NAV.filter((n) => n.roles.includes(user.role));

  const today = new Date().toLocaleDateString("en-LK", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Sidebar content — reused for desktop + mobile
  const Sidebar = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#0A1628",
      }}
    >
      {/* Gold top line */}
      <div
        style={{
          height: 4,
          background: "linear-gradient(90deg, #F5A800, #C98B00)",
          flexShrink: 0,
        }}
      />

      {/* Logo */}
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
                fontSize: 20,
                fontWeight: 900,
                color: "#0A1628",
                fontFamily: "Georgia, serif",
                letterSpacing: -1,
              }}
            >
              B
            </span>
          </div>
          <div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 14,
                color: "#fff",
                fontFamily: "Georgia, serif",
                letterSpacing: -0.5,
                lineHeight: 1,
              }}
            >
              Bank of Ceylon
            </div>
            <div
              style={{
                fontSize: 9,
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

      {/* Nav links */}
      <nav
        style={{
          flex: 1,
          padding: "10px 8px",
          overflowY: "auto",
        }}
      >
        {filtered.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: "none", display: "block", marginBottom: 2 }}
              onClick={() => setMobileOpen(false)}
            >
              <div className={`nav-item${active ? " active" : ""}`}>
                <item.icon size={15} style={{ flexShrink: 0 }} />
                {item.label}
                {active && (
                  <ChevronRight size={12} style={{ marginLeft: "auto" }} />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div
        style={{
          padding: "10px 8px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}
      >
        {/* User info card */}
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
            {user.name.charAt(0)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
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
              style={{
                fontSize: 10,
                color: "#F5A800",
                fontWeight: 600,
              }}
            >
              {ROLE_LABELS[user.role] ?? user.role}
            </div>
          </div>
        </div>

        {/* Sign out */}
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
      {/* Desktop sidebar */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
            }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 240,
              zIndex: 60,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* Topbar */}
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
          {/* Mobile menu toggle */}
          <button
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

          {/* Date */}
          <span style={{ fontSize: 12, color: "#94A3B8" }}>
            🕐 {today}
          </span>

          <span style={{ color: "#E2E8F0" }}>|</span>

          {/* System status */}
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

          {/* Compliance badge */}
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

          {/* Branch */}
          <span style={{ fontSize: 12, color: "#94A3B8" }}>
            {user.branch}
          </span>
        </header>

        {/* Page content */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 26,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}