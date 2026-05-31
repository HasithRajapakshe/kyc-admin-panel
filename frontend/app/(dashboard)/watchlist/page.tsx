"use client";

import { useEffect, useState, useCallback } from "react";
import { watchlistApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Search, Plus, Trash2, Download, X, AlertCircle } from "lucide-react";
import { formatDate, downloadBlob } from "@/lib/utils";

interface WatchlistEntry {
    id: number;
    nic_number: string;
    reason: string;
    added_by?: string;
    added_at: string;
}

function AddModal({
    onClose,
    onSuccess,
}: {
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [nic, setNic] = useState("");
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function handle() {
        if (!nic.trim() || !reason.trim()) {
            setError("NIC and reason are required");
            return;
        }
        setBusy(true);
        try {
            await watchlistApi.add({
                nic_number: nic.trim(),
                reason: reason.trim(),
            });
            onSuccess();
            onClose();
        } catch (err: unknown) {
            setError(
                (err as { response?: { data?: { detail?: string } } })
                    ?.response?.data?.detail ?? "Failed to add entry"
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 32,
                    width: 480,
                    boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 24,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                            style={{
                                padding: 10,
                                borderRadius: 10,
                                background: "#FEF3C7",
                            }}
                        >
                            <AlertCircle size={20} color="#D97706" />
                        </div>
                        <div>
                            <h3
                                style={{
                                    fontFamily: "Poppins, sans-serif",
                                    fontSize: 16,
                                    fontWeight: 800,
                                    color: "#0A1628",
                                }}
                            >
                                Add to Watchlist
                            </h3>
                            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                                Flag a NIC for enhanced screening
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "#F1F5F9",
                            border: "none",
                            borderRadius: 8,
                            width: 30,
                            height: 30,
                            cursor: "pointer",
                            color: "#334155",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* NIC */}
                <div style={{ marginBottom: 16 }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#334155",
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            marginBottom: 6,
                        }}
                    >
                        NIC Number <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                        className="boc-input"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                        placeholder="e.g. 982345678V"
                        value={nic}
                        onChange={(e) => setNic(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Reason */}
                <div style={{ marginBottom: 20 }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#334155",
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            marginBottom: 6,
                        }}
                    >
                        Reason <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <textarea
                        className="boc-input"
                        rows={3}
                        style={{ resize: "none" }}
                        placeholder="Reason for flagging this NIC…"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>

                {error && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            color: "#DC2626",
                            fontSize: 13,
                            marginBottom: 16,
                        }}
                    >
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: "9px",
                            borderRadius: 8,
                            border: "1px solid #E2E8F0",
                            background: "transparent",
                            color: "#334155",
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                            fontFamily: "Poppins, sans-serif",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handle}
                        disabled={busy}
                        style={{
                            flex: 1,
                            padding: "9px",
                            borderRadius: 8,
                            border: "none",
                            background: "linear-gradient(135deg, #F5A800, #C98B00)",
                            color: "#0A1628",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: busy ? "not-allowed" : "pointer",
                            opacity: busy ? 0.7 : 1,
                            fontFamily: "Poppins, sans-serif",
                        }}
                    >
                        {busy ? "Adding…" : "Add to Watchlist"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function WatchlistPage() {
    const { isAdmin, isSuperAdmin } = useAuth();
    const [items, setItems] = useState<WatchlistEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [toast, setToast] = useState<{
        type: "success" | "error";
        msg: string;
    } | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await watchlistApi.list({
                search: search || undefined,
            });
            setItems(res.data.items ?? res.data ?? []);
            setTotal(res.data.total ?? res.data?.length ?? 0);
        } catch (e) {
            console.error(e);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const t = setTimeout(fetchData, 300);
        return () => clearTimeout(t);
    }, [fetchData]);

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3500);
            return () => clearTimeout(t);
        }
    }, [toast]);

    async function handleDelete(id: number) {
        if (!confirm("Remove this NIC from the watchlist?")) return;
        setDeleting(id);
        try {
            await watchlistApi.remove(id);
            setToast({ type: "success", msg: "Entry removed from watchlist" });
            fetchData();
        } catch {
            setToast({ type: "error", msg: "Failed to remove entry" });
        } finally {
            setDeleting(null);
        }
    }

    async function handleExport() {
        try {
            const res = await watchlistApi.exportCsv();
            downloadBlob(
                res.data,
                `watchlist_${new Date().toISOString().slice(0, 10)}.csv`
            );
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <div style={{ maxWidth: 1000 }}>
            {/* Toast */}
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 28,
                        right: 28,
                        zIndex: 2000,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: toast.type === "success" ? "#0A1628" : "#7F1D1D",
                        color: "#fff",
                        padding: "14px 20px",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "Poppins, sans-serif",
                    }}
                >
                    <div
                        style={{
                            width: 4,
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            borderRadius: "12px 0 0 12px",
                            background: "#F5A800",
                        }}
                    />
                    {toast.type === "success" ? "✓" : "⚠"} {toast.msg}
                </div>
            )}

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
                            fontFamily: "Poppins, sans-serif",
                            letterSpacing: -0.5,
                        }}
                    >
                        Watchlist
                    </h1>
                    <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 3 }}>
                        Flagged NICs for enhanced screening ·{" "}
                        {total} {total === 1 ? "entry" : "entries"}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    {isSuperAdmin && (
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
                                fontFamily: "Poppins, sans-serif",
                            }}
                        >
                            <Download size={13} /> Export
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            onClick={() => setShowAdd(true)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "8px 14px",
                                borderRadius: 8,
                                background: "linear-gradient(135deg, #F5A800, #C98B00)",
                                color: "#0A1628",
                                border: "none",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "Poppins, sans-serif",
                            }}
                        >
                            <Plus size={13} /> Add NIC
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div
                style={{ position: "relative", maxWidth: 360, marginBottom: 18 }}
            >
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
                    placeholder="Search by NIC…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
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
                                <th>NIC Number</th>
                                <th>Reason</th>
                                <th>Added By</th>
                                <th>Date Added</th>
                                {isSuperAdmin && <th>Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: isSuperAdmin ? 5 : 4 }).map(
                                            (_, j) => (
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
                                            )
                                        )}
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={isSuperAdmin ? 5 : 4}
                                        style={{
                                            textAlign: "center",
                                            padding: "60px 0",
                                            color: "#94A3B8",
                                        }}
                                    >
                                        <div style={{ fontSize: 40, marginBottom: 12 }}>
                                            🛡️
                                        </div>
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                color: "#334155",
                                                fontSize: 14,
                                            }}
                                        >
                                            No watchlist entries
                                        </div>
                                        <div style={{ fontSize: 12, marginTop: 4 }}>
                                            {isAdmin
                                                ? 'Click "Add NIC" to flag a suspicious NIC'
                                                : "No NICs have been flagged yet"}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>
                                            <span
                                                style={{
                                                    fontFamily: "Poppins, sans-serif",
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    color: "#D97706",
                                                }}
                                            >
                                                {entry.nic_number}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: "#334155",
                                                }}
                                            >
                                                {entry.reason}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    fontFamily: "Poppins, sans-serif",
                                                    color: "#94A3B8",
                                                }}
                                            >
                                                {entry.added_by ?? "—"}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12 }}>
                                            {formatDate(entry.added_at)}
                                        </td>
                                        {isSuperAdmin && (
                                            <td>
                                                <button
                                                    onClick={() => handleDelete(entry.id)}
                                                    disabled={deleting === entry.id}
                                                    style={{
                                                        background: "#FEE2E2",
                                                        border: "none",
                                                        borderRadius: 6,
                                                        padding: "5px 8px",
                                                        cursor:
                                                            deleting === entry.id
                                                                ? "not-allowed"
                                                                : "pointer",
                                                        opacity: deleting === entry.id ? 0.5 : 1,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        color: "#DC2626",
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        fontFamily: "Poppins, sans-serif",
                                                    }}
                                                >
                                                    <Trash2 size={12} />
                                                    Remove
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAdd && (
                <AddModal
                    onClose={() => setShowAdd(false)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
}