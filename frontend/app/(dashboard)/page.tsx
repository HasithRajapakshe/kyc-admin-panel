"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { dashboardApi, applicationsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertTriangle,
  Smartphone,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { formatDateTime, maskNic } from "@/lib/utils";

interface KPIs {
  total_applications: number;
  pending: number;
  approved: number;
  rejected: number;
  today_submitted: number;
  approval_rate: number;
  high_risk: number;
  otp_verified: number;
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const cfg: Record<string, { bg: string; color: string; dot: string }> = {
    pending: { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
    approved: { bg: "#DCFCE7", color: "#14532D", dot: "#22C55E" },
    rejected: { bg: "#FEE2E2", color: "#7F1D1D", dot: "#EF4444" },
    reviewing: { bg: "#DBEAFE", color: "#1E3A8A", dot: "#3B82F6" },
  };
  const c = cfg[status] ?? cfg.pending;
  return (
    <span style={{ background: c.bg, color: c.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  gradient,
  color,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  gradient: string;
  color: string;
  sub: string;
}) {
  return (
    <div
      className="kpi-card"
      style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 14,
        padding: "18px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          borderRadius: "0 14px 0 80px",
          background: gradient,
          opacity: 0.5,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          position: "relative",
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "#94A3B8",
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <Icon size={18} color={color} />
      </div>
      <div
        style={{
          fontSize: 34,
          fontWeight: 900,
          color: "#0A1628",
          lineHeight: 1,
          marginTop: 10,
          fontFamily: "Poppins, sans-serif",
          position: "relative",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#94A3B8",
          marginTop: 8,
          position: "relative",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 14,
        padding: 40,
        textAlign: "center",
        gridColumn: "1 / -1",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#0A1628",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        No data yet
      </div>
      <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 6 }}>
        KPI data will appear here once the AI model starts processing applications.
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [error, setError] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(false);
      const [kpisRes, appsRes] = await Promise.all([
        dashboardApi.kpis(),
        applicationsApi.list({ limit: 5 })
      ]);
      setKpis(kpisRes.data);
      setRecentApps(appsRes.data?.items ?? []);
      setLastRefresh(new Date());
    } catch (e) {
      setError(true);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30_000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const row1 = kpis
    ? [
      {
        label: "Total Applications",
        value: kpis.total_applications?.toLocaleString() ?? 0,
        icon: FileText,
        gradient: "linear-gradient(135deg, #DBEAFE, #BFDBFE)",
        color: "#2563EB",
        sub: "All KYC sessions",
      },
      {
        label: "Pending Review",
        value: kpis.pending ?? 0,
        icon: Clock,
        gradient: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
        color: "#D97706",
        sub: "Awaiting decision",
      },
      {
        label: "Approved",
        value: kpis.approved?.toLocaleString() ?? 0,
        icon: CheckCircle,
        gradient: "linear-gradient(135deg, #DCFCE7, #BBF7D0)",
        color: "#15803D",
        sub: "Successfully onboarded",
      },
      {
        label: "Rejected",
        value: kpis.rejected ?? 0,
        icon: XCircle,
        gradient: "linear-gradient(135deg, #FEE2E2, #FECACA)",
        color: "#DC2626",
        sub: "Applications declined",
      },
    ]
    : [];

  const row2 = kpis
    ? [
      {
        label: "Submitted Today",
        value: kpis.today_submitted ?? 0,
        icon: TrendingUp,
        gradient: "linear-gradient(135deg, #EDE9FE, #DDD6FE)",
        color: "#7C3AED",
        sub: "New today",
      },
      {
        label: "High Risk",
        value: kpis.high_risk ?? 0,
        icon: AlertTriangle,
        gradient: "linear-gradient(135deg, #FEE2E2, #FECACA)",
        color: "#DC2626",
        sub: "Risk score above 70",
      },
      {
        label: "OTP Verified",
        value: kpis.otp_verified?.toLocaleString() ?? 0,
        icon: Smartphone,
        gradient: "linear-gradient(135deg, #CCFBF1, #99F6E4)",
        color: "#0D9488",
        sub: "Phone confirmed",
      },
      {
        label: "Approval Rate",
        value: kpis.approval_rate
          ? `${kpis.approval_rate.toFixed(1)}%`
          : "0%",
        icon: CheckCircle,
        gradient: "linear-gradient(135deg, #DCFCE7, #BBF7D0)",
        color: "#15803D",
        sub: "Of all applications",
      },
    ]
    : [];

  return (
    <div style={{ width: "100%", paddingRight: 16 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 34,
              fontWeight: 900,
              color: "#0A1628",
              fontFamily: "Poppins, sans-serif",
              letterSpacing: -0.5,
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: 15, color: "#94A3B8", marginTop: 4 }}>
            Welcome back, {user?.name} · auto-refreshes every 30s
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            background: "transparent",
            border: "1px solid #E2E8F0",
            color: "#334155",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 13,
            color: "#DC2626",
            marginBottom: 20,
          }}
        >
          ⚠ Could not load dashboard data. Make sure the backend is running.
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            marginBottom: 14,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: 14,
                padding: "18px 20px",
                height: 110,
              }}
            >
              <div
                style={{
                  height: 10,
                  background: "#F1F5F9",
                  borderRadius: 4,
                  width: "60%",
                  marginBottom: 16,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  height: 28,
                  background: "#F1F5F9",
                  borderRadius: 4,
                  width: "40%",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Row 1 KPIs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
              marginBottom: 14,
            }}
          >
            {row1.length > 0 ? (
              row1.map((c) => <KpiCard key={c.label} {...c} />)
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Row 2 KPIs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
              marginBottom: 24,
            }}
          >
            {row2.map((c) => (
              <KpiCard key={c.label} {...c} />
            ))}
          </div>

          {/* Bottom Grid: Recent Applications & Info Banner */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            {/* Recent Applications Table */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: 14,
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", fontFamily: "Poppins, sans-serif" }}>Recent Applications</h3>
                <Link href="/applications" style={{ fontSize: 12, color: "#2563EB", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                  View All <ChevronRight size={14} />
                </Link>
              </div>

              {recentApps.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                  No recent applications found.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="boc-table">
                    <thead>
                      <tr>
                        <th>Application ID</th>
                        <th>Customer</th>
                        <th>Submitted</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentApps.map((app) => (
                        <tr key={app.session_id}>
                          <td>
                            <Link href={`/applications/${app.session_id}`} style={{ color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>
                              {app.session_id.substring(0, 15)}...
                            </Link>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{app.full_name || "—"}</div>
                            <div style={{ fontSize: 11, color: "#94A3B8" }}>{maskNic(app.nic_number)}</div>
                          </td>
                          <td style={{ fontSize: 12 }}>{formatDateTime(app.created_at)}</td>
                          <td><StatusBadge status={app.verification_status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Actions & System Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>


              {/* Quick Actions */}
              <div style={{
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: 14,
                padding: "20px 24px",
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", fontFamily: "Poppins, sans-serif", marginBottom: 16 }}>Quick Actions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link href="/applications?status=pending" style={{ textDecoration: "none" }}>
                    <div style={{ padding: "12px 16px", background: "#F8FAFC", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#0A1628", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #E2E8F0", transition: "all 0.2s" }} className="kpi-card">
                      Review Pending Apps <ChevronRight size={14} color="#94A3B8" />
                    </div>
                  </Link>
                  <Link href="/watchlist" style={{ textDecoration: "none" }}>
                    <div style={{ padding: "12px 16px", background: "#F8FAFC", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#0A1628", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #E2E8F0", transition: "all 0.2s" }} className="kpi-card">
                      Manage Watchlist <ChevronRight size={14} color="#94A3B8" />
                    </div>
                  </Link>
                  <Link href="/users" style={{ textDecoration: "none" }}>
                    <div style={{ padding: "12px 16px", background: "#F8FAFC", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#0A1628", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #E2E8F0", transition: "all 0.2s" }} className="kpi-card">
                      User Management <ChevronRight size={14} color="#94A3B8" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}