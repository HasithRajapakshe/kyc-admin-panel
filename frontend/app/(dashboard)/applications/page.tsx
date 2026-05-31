"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { applicationsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
    Search,
    Download,
    ChevronLeft,
    ChevronRight,
    ChevronRight as Arrow,
} from "lucide-react";
import { formatDate, maskNic, downloadBlob } from "@/lib/utils";

interface App {
    session_id: string;
    customer_name?: string;
    nic?: string;
    email?: string;
    status: string;
    created_at: string;
    ai_confidence_score?: number;
    otp_verified?: boolean;
    session_status?: string;
    risk_score?: number;
}

const STATUSES = ["all", "pending", "approved", "rejected", "reviewing"];

function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, { bg: string; color: string; dot: string }> = {
        pending: { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
        approved: { bg: "#DCFCE7", color: "#14532D", dot: "#22C55E" },
        rejected: { bg: "#FEE2E2", color: "#7F1D1D", dot: "#EF4444" },
        reviewing: { bg: "#DBEAFE", color: "#1E3A8A", dot: "#3B82F6" },
        completed: { bg: "#DBEAFE", color: "#1E3A8A", dot: "#3B82F6" },
        in_progress: { bg: "#FEF9C3", color: "#713F12", dot: "#EAB308" },
    };
    const c = cfg[status] ?? cfg.pending;
    return (
        <span
            style={{
                background: c.bg,
                color: c.color,
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
            }}
        >
            <span
                style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: c.dot,
                    display: "inline-block",
                    flexShrink: 0,
                }}
            />
            {status.replace("_", " ").charAt(0).toUpperCase() +
                status.replace("_", " ").slice(1)}
        </span>
    );
}

function RiskBadge({ score }: { score?: number | null }) {
    if (score == null) return <span style={{ color: "#94A3B8" }}>—</span>;
    const high = score >= 70;
    const med = score >= 40;
    const bg = high ? "#FEE2E2" : med ? "#FEF3C7" : "#DCFCE7";
    const color = high ? "#7F1D1D" : med ? "#92400E" : "#14532D";
    const bar = high ? "#EF4444" : med ? "#F59E0B" : "#22C55E";
    const label = high ? "High" : med ? "Medium" : "Low";
    return (
        <span
            style={{
                background: bg,
                color,
                padding: "3px 9px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
            }}
        >
            <span
                style={{
                    width: 20,
                    height: 4,
                    borderRadius: 2,
                    background: `linear-gradient(90deg, ${bar} ${score}%, #E5E7EB ${score}%)`,
                    display: "inline-block",
                }}
            />
            {label} {score}
        </span>
    );
}

export default function ApplicationsPage() {
    const { isAdmin } = useAuth();
    const [items, setItems] = useState<App[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const PAGE_SIZE = 20;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await applicationsApi.list({
                page,
                page_size: PAGE_SIZE,
                search: search || undefined,
                status: status === "all" ? undefined : status,
            });
            setItems(res.data.items ?? res.data ?? []);
            setTotal(res.data.total ?? res.data?.length ?? 0);
        } catch (e) {
            console.error(e);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [page, search, status]);

    useEffect(() => {
        const t = setTimeout(fetchData, 300);
        return () => clearTimeout(t);
    }, [fetchData]);

    useEffect(() => {
        setPage(1);
    }, [search, status]);

    async function handleExport() {
        try {
            const res = await applicationsApi.exportCsv();
            downloadBlob(
                res.data,
                `applications_${new Date().toISOString().slice(0, 10)}.csv`
            );
        } catch (e) {
            console.error(e);
        }
    }

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div style={{ maxWidth: 1200 }}>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 22,
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
                        Customer Applications
                    </h1>
                    <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 3 }}>
                        Review and action KYC onboarding sessions ·{" "}
                        {total.toLocaleString()} records
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={handleExport}
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
                        <Download size={13} />
                        Export CSV
                    </button>
                )}
            </div>

            {/* Search + Filter */}
            <div
                style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 18,
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >
                {/* Search */}
                <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
                    <Search
                        size={14}
                        style={{
                            position: "absolute",
                            left: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#94A3B8",
                        }}
                    />
                    <input
                        className="boc-input"
                        style={{ paddingLeft: 34 }}
                        placeholder="Search by name, NIC or session ID…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Status filter pills */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {STATUSES.map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatus(s)}
                            style={{
                                padding: "7px 14px",
                                borderRadius: 8,
                                border: `1px solid ${status === s ? "#0A1628" : "#E2E8F0"}`,
                                background: status === s ? "#0A1628" : "#fff",
                                color: status === s ? "#fff" : "#334155",
                                fontWeight: status === s ? 700 : 500,
                                fontSize: 12,
                                cursor: "pointer",
                                textTransform: "capitalize",
                                fontFamily: "'DM Sans', sans-serif",
                                transition: "all 0.15s",
                            }}
                        >
                            {s === "all" ? "All" : s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div
                style={{
                    background: "#fff",
                    border: "1px solid #E2E8F0",
                    borderRadius: 14,
                    overflow: "hidden",
                }}
            >
                <div style={{ overflowX: "auto" }}>
                    <table className="boc-table">
                        <thead>
                            <tr>
                                <th>Application ID</th>
                                <th>Customer</th>
                                <th>NIC</th>
                                <th>Submitted</th>
                                <th>Status</th>
                                <th>Risk</th>
                                <th>OTP</th>
                                <th>Session</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 9 }).map((_, j) => (
                                            <td key={j}>
                                                <div
                                                    style={{
                                                        height: 12,
                                                        background: "#F1F5F9",
                                                        borderRadius: 4,
                                                        width: "70%",
                                                        animation:
                                                            "pulse 1.5s ease-in-out infinite",
                                                    }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        style={{
                                            textAlign: "center",
                                            padding: "60px 0",
                                            color: "#94A3B8",
                                        }}
                                    >
                                        <div style={{ fontSize: 40, marginBottom: 12 }}>
                                            📋
                                        </div>
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                color: "#334155",
                                                fontSize: 14,
                                            }}
                                        >
                                            No applications found
                                        </div>
                                        <div
                                            style={{ fontSize: 12, marginTop: 4, color: "#94A3B8" }}
                                        >
                                            Applications will appear here once the AI model
                                            starts processing KYC sessions
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((app) => (
                                    <tr key={app.session_id}>
                                        <td>
                                            <span
                                                style={{
                                                    color: "#2563EB",
                                                    fontWeight: 700,
                                                    fontSize: 12,
                                                    fontFamily: "monospace",
                                                }}
                                            >
                                                {app.session_id.slice(0, 16)}…
                                            </span>
                                        </td>
                                        <td>
                                            <div>
                                                <div
                                                    style={{
                                                        fontWeight: 600,
                                                        color: "#0A1628",
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {app.customer_name ?? "—"}
                                                </div>
                                                {app.email && (
                                                    <div
                                                        style={{ fontSize: 11, color: "#94A3B8" }}
                                                    >
                                                        {app.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                style={{ fontFamily: "monospace", fontSize: 12 }}
                                            >
                                                {maskNic(app.nic)}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12 }}>
                                            {formatDate(app.created_at)}
                                        </td>
                                        <td>
                                            <StatusBadge status={app.status} />
                                        </td>
                                        <td>
                                            <RiskBadge score={app.risk_score} />
                                        </td>
                                        <td
                                            style={{
                                                fontWeight: 700,
                                                fontSize: 13,
                                                color:
                                                    app.otp_verified ? "#15803D" : "#DC2626",
                                            }}
                                        >
                                            {app.otp_verified != null
                                                ? app.otp_verified
                                                    ? "✓ Yes"
                                                    : "✗ No"
                                                : "—"}
                                        </td>
                                        <td>
                                            {app.session_status ? (
                                                <StatusBadge status={app.session_status} />
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td>
                                            <Link
                                                href={`/applications/${app.session_id}`}
                                                style={{ textDecoration: "none" }}
                                            >
                                                <button
                                                    style={{
                                                        background:
                                                            "linear-gradient(135deg, #F5A800, #C98B00)",
                                                        color: "#0A1628",
                                                        border: "none",
                                                        borderRadius: 6,
                                                        padding: "5px 12px",
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        fontFamily: "'DM Sans', sans-serif",
                                                    }}
                                                >
                                                    View <Arrow size={11} />
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            borderTop: "1px solid #E2E8F0",
                        }}
                    >
                        <span style={{ fontSize: 12, color: "#94A3B8" }}>
                            Page {page} of {totalPages} · {total} total
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{
                                    padding: "5px 8px",
                                    borderRadius: 6,
                                    border: "1px solid #E2E8F0",
                                    background: "#fff",
                                    cursor: page === 1 ? "not-allowed" : "pointer",
                                    opacity: page === 1 ? 0.4 : 1,
                                    color: "#334155",
                                }}
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={() =>
                                    setPage((p) => Math.min(totalPages, p + 1))
                                }
                                disabled={page === totalPages}
                                style={{
                                    padding: "5px 8px",
                                    borderRadius: 6,
                                    border: "1px solid #E2E8F0",
                                    background: "#fff",
                                    cursor:
                                        page === totalPages ? "not-allowed" : "pointer",
                                    opacity: page === totalPages ? 0.4 : 1,
                                    color: "#334155",
                                }}
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}