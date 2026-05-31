"use client";

import { useEffect, useState, useCallback } from "react";
import { dashboardApi } from "@/lib/api";
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
} from "lucide-react";

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
      {/* Corner gradient */}
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
            fontSize: 11,
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
          fontSize: 30,
          fontWeight: 900,
          color: "#0A1628",
          lineHeight: 1,
          marginTop: 10,
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
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
          fontFamily: "Georgia, serif",
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
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [error, setError] = useState(false);

  const fetchKpis = useCallback(async () => {
    try {
      setError(false);
      const res = await dashboardApi.kpis();
      setKpis(res.data);
      setLastRefresh(new Date());
    } catch (e) {
      setError(true);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKpis();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchKpis, 30_000);
    return () => clearInterval(interval);
  }, [fetchKpis]);

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
    <div style={{ maxWidth: 1200 }}>
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
              fontSize: 22,
              fontWeight: 900,
              color: "#0A1628",
              fontFamily: "Georgia, serif",
              letterSpacing: -0.5,
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 3 }}>
            Welcome back, {user?.name} · auto-refreshes every 30s
          </p>
        </div>
        <button
          onClick={fetchKpis}
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
            fontFamily: "'DM Sans', sans-serif",
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

          {/* Info banner */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 14,
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
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
              <span style={{ fontSize: 22 }}>🏦</span>
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0A1628",
                  fontFamily: "Georgia, serif",
                }}
              >
                Bank of Ceylon — KYC Admin Portal
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>
                Connected to AI KYC model · CBSL & FIU-SL Compliant ·
                Last refreshed:{" "}
                {lastRefresh.toLocaleTimeString("en-LK", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}