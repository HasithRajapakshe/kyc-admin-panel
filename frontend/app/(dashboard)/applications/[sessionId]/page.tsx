"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { applicationsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    User,
    Smartphone,
    FileText,
    Camera,
    PenLine,
    ScrollText,
    CreditCard,
    X,
} from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/utils";

// ── Types matching backend response ──────────────────
interface BackendDetail {
    customer: {
        id: number;
        session_id: string;
        full_name: string;
        nic_number: string;
        date_of_birth?: string;
        age?: number;
        gender?: string;
        address?: string;
        phone_number?: string;
        email?: string;
        otp_verified: boolean;
        otp_attempts: number;
        selfie_image?: string;
        account_purpose?: string;
        account_number?: string;
        verification_status: string;
        risk_score?: string | number;
        created_at: string;
        updated_at: string;
    };
    sessions: Array<{
        session_id: string;
        language: string;
        status: string;
        started_at: string;
        completed_at?: string;
        name_verified: boolean;
    }>;
    logs: Array<{
        step: string;
        action: string;
        result: string;
        details?: string;
        confidence_score?: string;
        timestamp: string;
    }>;
    documents: Array<{
        id: number;
        type: string;
        file_path: string;
        file_size: number;
        quality_score?: string;
        uploaded_at: string;
    }>;
    signatures: Array<{
        type: string;
        data: string;
        created_at: string;
    }>;
    accounts: Array<{
        account_number: string;
        account_type: string;
        branch: string;
        status: string;
        created_at: string;
    }>;
}

const TABS = [
    { id: "overview", label: "Overview", icon: User },
    { id: "otp", label: "OTP", icon: Smartphone },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "biometrics", label: "Biometrics", icon: Camera },
    { id: "signature", label: "Signature", icon: PenLine },
    { id: "logs", label: "Session Logs", icon: ScrollText },
    { id: "account", label: "Account", icon: CreditCard },
];

function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, { bg: string; color: string; dot: string }> = {
        pending: { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
        approved: { bg: "#DCFCE7", color: "#14532D", dot: "#22C55E" },
        rejected: { bg: "#FEE2E2", color: "#7F1D1D", dot: "#EF4444" },
        reviewing: { bg: "#DBEAFE", color: "#1E3A8A", dot: "#3B82F6" },
        completed: { bg: "#DBEAFE", color: "#1E3A8A", dot: "#3B82F6" },
        in_progress: { bg: "#FEF9C3", color: "#713F12", dot: "#EAB308" },
        started: { bg: "#F3F4F6", color: "#374151", dot: "#9CA3AF" },
    };
    const c = cfg[status] ?? cfg.pending;
    return (
        <span style={{ background: c.bg, color: c.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
            {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}
        </span>
    );
}

function Field({ label, value }: { label: string; value?: string | null }) {
    return (
        <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
            <div style={{ fontWeight: 600, color: "#0A1628", fontSize: 13 }}>{value || "—"}</div>
        </div>
    );
}

function ActionModal({ type, onConfirm, onClose }: {
    type: "approve" | "reject";
    onConfirm: (reason: string) => void;
    onClose: () => void;
}) {
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const isApprove = type === "approve";

    async function handle() {
        if (!reason.trim()) return;
        setBusy(true);
        await onConfirm(reason.trim());
        setBusy(false);
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 32, width: 480, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ padding: 10, borderRadius: 10, background: isApprove ? "#DCFCE7" : "#FEE2E2" }}>
                            {isApprove ? <CheckCircle size={20} color="#15803D" /> : <XCircle size={20} color="#DC2626" />}
                        </div>
                        <div>
                            <h3 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 800, color: "#0A1628" }}>
                                {isApprove ? "Approve Application" : "Reject Application"}
                            </h3>
                            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>This action will be permanently logged</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={14} />
                    </button>
                </div>
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
                        Reason *
                    </label>
                    <textarea
                        className="boc-input" rows={4} style={{ resize: "none" }}
                        placeholder={isApprove ? "e.g. All documents verified and face match confirmed" : "e.g. NIC number mismatch with submitted documents"}
                        value={reason} onChange={e => setReason(e.target.value)} autoFocus
                    />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #E2E8F0", background: "transparent", color: "#334155", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                        Cancel
                    </button>
                    <button onClick={handle} disabled={!reason.trim() || busy} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: isApprove ? "linear-gradient(135deg,#22C55E,#15803D)" : "linear-gradient(135deg,#EF4444,#DC2626)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: !reason.trim() || busy ? "not-allowed" : "pointer", opacity: !reason.trim() || busy ? 0.5 : 1, fontFamily: "'DM Sans', sans-serif" }}>
                        {busy ? "Processing…" : isApprove ? "Confirm Approve" : "Confirm Reject"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Tab components ────────────────────────────────────

function OverviewTab({ data }: { data: BackendDetail }) {
    const c = data.customer;
    const riskScore = c.risk_score != null ? parseFloat(String(c.risk_score)) : null;
    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <Field label="Full Name" value={c.full_name} />
                <Field label="NIC Number" value={c.nic_number} />
                <Field label="Date of Birth" value={formatDate(c.date_of_birth)} />
                <Field label="Age" value={c.age ? `${c.age} years` : null} />
                <Field label="Gender" value={c.gender} />
                <Field label="Phone" value={c.phone_number} />
                <Field label="Email" value={c.email} />
                <Field label="Account Purpose" value={c.account_purpose} />
                <Field label="Submitted At" value={formatDateTime(c.created_at)} />
                <Field label="Status" value={c.verification_status?.toUpperCase()} />
                {riskScore != null && (
                    <Field label="Risk Score" value={`${riskScore.toFixed(1)} / 100`} />
                )}
                {data.sessions[0] && (
                    <Field label="Language" value={data.sessions[0].language?.toUpperCase()} />
                )}
            </div>
            {c.address && (
                <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
                    <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Address</div>
                    <div style={{ fontWeight: 600, color: "#0A1628", fontSize: 13 }}>{c.address}</div>
                </div>
            )}
            {riskScore != null && (
                <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Risk Score</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: riskScore >= 70 ? "#DC2626" : riskScore >= 40 ? "#D97706" : "#15803D", fontFamily: "Georgia, serif" }}>
                            {riskScore.toFixed(1)} / 100
                        </span>
                    </div>
                    <div style={{ background: "#E2E8F0", borderRadius: 4, height: 8 }}>
                        <div style={{ width: `${riskScore}%`, height: "100%", borderRadius: 4, background: riskScore >= 70 ? "linear-gradient(90deg,#EF4444,#DC2626)" : riskScore >= 40 ? "linear-gradient(90deg,#F59E0B,#D97706)" : "linear-gradient(90deg,#22C55E,#15803D)", transition: "width 0.8s ease" }} />
                    </div>
                </div>
            )}
        </div>
    );
}

function OtpTab({ data }: { data: BackendDetail }) {
    const c = data.customer;
    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div style={{ background: c.otp_verified ? "#DCFCE7" : "#FEE2E2", borderRadius: 10, padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 36 }}>{c.otp_verified ? "✓" : "✗"}</div>
                    <div style={{ fontWeight: 700, color: c.otp_verified ? "#166534" : "#7F1D1D", fontSize: 14, marginTop: 6 }}>
                        {c.otp_verified ? "OTP Verified" : "Not Verified"}
                    </div>
                </div>
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Phone Number</div>
                    <div style={{ fontWeight: 700, color: "#0A1628", fontSize: 14 }}>{c.phone_number ?? "—"}</div>
                </div>
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Attempts</div>
                    <div style={{ fontWeight: 900, color: "#0A1628", fontSize: 28, fontFamily: "Georgia, serif" }}>{c.otp_attempts ?? 0}</div>
                </div>
            </div>
            <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>
                    OTP code: <span style={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: 4, color: "#0A1628" }}>••••••</span>
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 8 }}>
                    OTP is sent to customer phone number during KYC session
                </div>
            </div>
        </div>
    );
}

function DocumentsTab({ data }: { data: BackendDetail }) {
    if (!data.documents?.length) {
        return (
            <div style={{ textAlign: "center", padding: 48, color: "#94A3B8" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🪪</div>
                <div style={{ fontWeight: 600, color: "#334155" }}>No documents found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Document data will appear once the AI processes the session</div>
            </div>
        );
    }
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {data.documents.map((doc, i) => {
                const qualityNum = doc.quality_score ? parseFloat(doc.quality_score) : null;
                return (
                    <div key={i} style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{ background: "#DBEAFE", height: 130, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                            <span style={{ fontSize: 48 }}>🪪</span>
                            {qualityNum != null && (
                                <span style={{ fontSize: 11, fontWeight: 700, color: qualityNum >= 80 ? "#15803D" : "#D97706" }}>
                                    Quality: {qualityNum.toFixed(1)}%
                                </span>
                            )}
                        </div>
                        <div style={{ padding: 14 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#0A1628", textTransform: "capitalize", marginBottom: 8 }}>
                                {doc.type?.replace(/_/g, " ")}
                            </div>
                            <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>
                                Size: {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : "—"}
                            </div>
                            <div style={{ fontSize: 11, color: "#94A3B8" }}>
                                Uploaded: {formatDateTime(doc.uploaded_at)}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function BiometricsTab({ data }: { data: BackendDetail }) {
    const c = data.customer;
    const hasSelfie = !!c.selfie_image;

    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ background: "#DBEAFE", height: 160, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                        {hasSelfie ? (
                            <img src={`data:image/jpeg;base64,${c.selfie_image}`} alt="Selfie" style={{ maxHeight: 150, maxWidth: "100%", objectFit: "cover" }} />
                        ) : (
                            <span style={{ fontSize: 60 }}>🤳</span>
                        )}
                    </div>
                    <div style={{ padding: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#0A1628" }}>Selfie / Liveness</div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                            {hasSelfie ? "Captured during session" : "Not captured"}
                        </div>
                    </div>
                </div>
                <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ background: "#F0FDF4", height: 160, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>
                        🪪
                    </div>
                    <div style={{ padding: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#0A1628" }}>NIC Photo</div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Extracted from document</div>
                    </div>
                </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                    { label: "OTP Verified", value: c.otp_verified ? "Pass" : "Fail", ok: c.otp_verified },
                    { label: "Name Verified", value: data.sessions[0]?.name_verified ? "Pass" : "Fail", ok: data.sessions[0]?.name_verified ?? false },
                    { label: "Session Status", value: data.sessions[0]?.status ?? "—", ok: data.sessions[0]?.status === "completed" },
                ].map(item => (
                    <div key={item.label} style={{ background: item.ok ? "#DCFCE7" : "#FEE2E2", borderRadius: 8, padding: 16, textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: item.ok ? "#166534" : "#7F1D1D", fontFamily: "Georgia, serif" }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: item.ok ? "#166534" : "#7F1D1D", marginTop: 4 }}>{item.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SignatureTab({ data }: { data: BackendDetail }) {
    const sig = data.signatures?.[0];
    if (!sig) {
        return (
            <div style={{ textAlign: "center", padding: 48, color: "#94A3B8" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✍️</div>
                <div style={{ fontWeight: 600, color: "#334155" }}>No signature found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Signature will appear once the AI processes the session</div>
            </div>
        );
    }
    return (
        <div>
            <div style={{ border: "2px dashed #E2E8F0", borderRadius: 12, padding: 32, textAlign: "center", marginBottom: 16, background: "#FAFAFA" }}>
                {sig.type === "canvas" && sig.data ? (
                    <img src={sig.data} alt="Signature" style={{ maxWidth: 400, maxHeight: 200 }} />
                ) : (
                    <div style={{ fontStyle: "italic", fontSize: 36, fontFamily: "cursive", color: "#0A1628" }}>
                        {data.customer.full_name?.split(" ")[0]}
                    </div>
                )}
            </div>
            <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#94A3B8" }}>
                <span>Type: <b style={{ color: "#334155" }}>{sig.type ?? "Canvas"}</b></span>
                <span>Captured: <b style={{ color: "#334155" }}>{formatDateTime(sig.created_at)}</b></span>
            </div>
        </div>
    );
}

function LogsTab({ data }: { data: BackendDetail }) {
    if (!data.logs?.length) {
        return (
            <div style={{ textAlign: "center", padding: 48, color: "#94A3B8" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📜</div>
                <div style={{ fontWeight: 600, color: "#334155" }}>No session logs found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Logs will appear once the AI processes the session</div>
            </div>
        );
    }
    return (
        <div style={{ position: "relative", paddingLeft: 24 }}>
            {data.logs.map((log, i) => {
                const dotColor = log.result === "success" ? "#22C55E" : log.result === "warning" ? "#F59E0B" : "#EF4444";
                return (
                    <div key={i} style={{ display: "flex", gap: 16, marginBottom: 14, position: "relative" }}>
                        <div style={{ position: "absolute", left: -22, top: 6, width: 10, height: 10, borderRadius: "50%", background: dotColor }} />
                        {i < data.logs.length - 1 && (
                            <div style={{ position: "absolute", left: -18, top: 16, width: 2, height: "calc(100% + 4px)", background: "#E2E8F0" }} />
                        )}
                        <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 8, padding: "10px 14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontWeight: 700, fontSize: 13, color: "#0A1628" }}>{log.action}</span>
                                    {log.step && (
                                        <span style={{ background: "#E2E8F0", color: "#334155", padding: "1px 7px", borderRadius: 4, fontSize: 10 }}>{log.step}</span>
                                    )}
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    {log.confidence_score && (
                                        <span style={{ fontSize: 11, fontWeight: 700, color: "#0D9488" }}>Score: {log.confidence_score}</span>
                                    )}
                                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#94A3B8" }}>{formatDateTime(log.timestamp)}</span>
                                </div>
                            </div>
                            {log.details && (
                                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{log.details}</div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function AccountTab({ data }: { data: BackendDetail }) {
    const account = data.accounts?.[0];
    const c = data.customer;

    if (!account && c.verification_status !== "approved") {
        return (
            <div style={{ textAlign: "center", padding: 48, color: "#94A3B8" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏦</div>
                <div style={{ fontWeight: 600, color: "#334155" }}>Account not yet created</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Account will be created upon application approval</div>
            </div>
        );
    }

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Account Number" value={account?.account_number ?? c.account_number} />
            <Field label="Account Type" value={account?.account_type ?? c.account_purpose} />
            <Field label="Branch" value={account?.branch ?? "Main Branch"} />
            <Field label="Status" value={account?.status ?? "Active"} />
            <Field label="Currency" value="LKR" />
            <Field label="Created At" value={formatDateTime(account?.created_at ?? c.updated_at)} />
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────

export default function AppDetailPage() {
    const { sessionId } = useParams() as { sessionId: string };
    const router = useRouter();
    const { user } = useAuth();
    const [data, setData] = useState<BackendDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("overview");
    const [modal, setModal] = useState<"approve" | "reject" | null>(null);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const res = await applicationsApi.get(sessionId);
            setData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3500);
            return () => clearTimeout(t);
        }
    }, [toast]);

    async function handleAction(type: "approve" | "reject", reason: string) {
        try {
            if (type === "approve") await applicationsApi.approve(sessionId, reason);
            else await applicationsApi.reject(sessionId, reason);
            setModal(null);
            setToast({ type: "success", msg: `Application ${type}d successfully.` });
            fetchData();
        } catch {
            setToast({ type: "error", msg: `Failed to ${type} application.` });
        }
    }

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
                <div style={{ width: 36, height: 36, border: "3px solid #F5A800", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ textAlign: "center", padding: 60, color: "#94A3B8" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <div style={{ fontWeight: 600, color: "#334155", fontSize: 16 }}>Application not found</div>
            </div>
        );
    }

    const c = data.customer;
    const isPending = c.verification_status === "pending";
    const riskScore = c.risk_score != null ? parseFloat(String(c.risk_score)) : null;

    return (
        <div style={{ maxWidth: 1100 }}>
            {/* Toast */}
            {toast && (
                <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 2000, display: "flex", alignItems: "center", gap: 12, background: toast.type === "success" ? "#0A1628" : "#7F1D1D", color: "#fff", padding: "14px 20px", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                    <div style={{ width: 4, position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: "12px 0 0 12px", background: "#F5A800" }} />
                    {toast.type === "success" ? "✓" : "⚠"} {toast.msg}
                </div>
            )}

            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13 }}>
                <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#2563EB", cursor: "pointer", fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 4, fontFamily: "'DM Sans', sans-serif" }}>
                    <ArrowLeft size={14} /> Applications
                </button>
                <span style={{ color: "#CBD5E1" }}>/</span>
                <span style={{ color: "#334155", fontWeight: 600 }}>{c.session_id?.slice(0, 20)}…</span>
            </div>

            {/* Profile header */}
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "20px 24px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#F5A800", flexShrink: 0 }}>
                        {c.full_name?.charAt(0) ?? "?"}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                            <span style={{ fontSize: 20, fontWeight: 900, color: "#0A1628", fontFamily: "Georgia, serif" }}>{c.full_name ?? "—"}</span>
                            <StatusBadge status={c.verification_status} />
                            {riskScore != null && (
                                <span style={{ background: riskScore >= 70 ? "#FEE2E2" : riskScore >= 40 ? "#FEF3C7" : "#DCFCE7", color: riskScore >= 70 ? "#7F1D1D" : riskScore >= 40 ? "#92400E" : "#14532D", padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                                    {riskScore >= 70 ? "⚠ High Risk" : riskScore >= 40 ? "Medium Risk" : "Low Risk"} · {riskScore.toFixed(0)}
                                </span>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                            {[["NIC", c.nic_number], ["Phone", c.phone_number], ["Purpose", c.account_purpose]].map(([l, v]) => v && (
                                <span key={l} style={{ fontSize: 12, color: "#94A3B8" }}>{l}: <b style={{ color: "#334155" }}>{v}</b></span>
                            ))}
                            <span style={{ fontSize: 12, color: "#94A3B8" }}>Submitted: <b style={{ color: "#334155" }}>{formatDateTime(c.created_at)}</b></span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    {isPending && user && (
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => setModal("reject")} style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
                                <XCircle size={14} /> Reject
                            </button>
                            <button onClick={() => setModal("approve")} style={{ background: "linear-gradient(135deg,#22C55E,#15803D)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
                                <CheckCircle size={14} /> Approve
                            </button>
                        </div>
                    )}
                    {!isPending && (
                        <div style={{ background: c.verification_status === "approved" ? "#DCFCE7" : "#FEE2E2", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: c.verification_status === "approved" ? "#166534" : "#7F1D1D" }}>
                            {c.verification_status === "approved" ? "✓ Application Approved" : "✗ Application Rejected"}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 4, width: "fit-content", flexWrap: "wrap" }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} className={`tab-btn${tab === t.id ? " active" : ""}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <t.icon size={13} />{t.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 24 }}>
                {tab === "overview" && <OverviewTab data={data} />}
                {tab === "otp" && <OtpTab data={data} />}
                {tab === "documents" && <DocumentsTab data={data} />}
                {tab === "biometrics" && <BiometricsTab data={data} />}
                {tab === "signature" && <SignatureTab data={data} />}
                {tab === "logs" && <LogsTab data={data} />}
                {tab === "account" && <AccountTab data={data} />}
            </div>

            {modal && (
                <ActionModal
                    type={modal}
                    onClose={() => setModal(null)}
                    onConfirm={reason => handleAction(modal, reason)}
                />
            )}
        </div>
    );
}