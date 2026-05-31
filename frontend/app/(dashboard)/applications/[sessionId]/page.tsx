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

interface Detail {
    session_id: string;
    status: string;
    created_at: string;
    updated_at?: string;
    ai_confidence_score?: number;
    risk_score?: number;
    rejection_reason?: string;
    approval_reason?: string;
    customer?: {
        name?: string;
        nic?: string;
        dob?: string;
        age?: number;
        gender?: string;
        phone?: string;
        email?: string;
        address?: string;
        language?: string;
        purpose?: string;
    };
    documents?: Array<{
        doc_type: string;
        file_url?: string;
        verified?: boolean;
        quality_score?: number;
        ocr_data?: Record<string, string>;
    }>;
    biometrics?: {
        selfie_url?: string;
        liveness_passed?: boolean;
        face_match_score?: number;
        liveness_score?: number;
        spoof_clear?: boolean;
    };
    signature?: {
        signature_url?: string;
        captured_at?: string;
        type?: string;
    };
    session_logs?: Array<{
        event: string;
        timestamp: string;
        step?: string;
        score?: number;
        result?: string;
    }>;
    account?: {
        account_type?: string;
        account_number?: string;
        branch?: string;
        currency?: string;
        created_at?: string;
    };
    otp?: {
        verified?: boolean;
        phone?: string;
        attempts?: number;
        sent_at?: string;
    };
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

function Field({ label, value }: { label: string; value?: string | null }) {
    return (
        <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
            <div style={{ fontWeight: 600, color: "#0A1628", fontSize: 13 }}>{value || "—"}</div>
        </div>
    );
}

function ActionModal({
    type,
    onConfirm,
    onClose,
}: {
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ padding: 10, borderRadius: 10, background: isApprove ? "#DCFCE7" : "#FEE2E2" }}>
                            {isApprove
                                ? <CheckCircle size={20} color="#15803D" />
                                : <XCircle size={20} color="#DC2626" />}
                        </div>
                        <div>
                            <h3 style={{ fontFamily: "Poppins, sans-serif", fontSize: 16, fontWeight: 800, color: "#0A1628" }}>
                                {isApprove ? "Approve Application" : "Reject Application"}
                            </h3>
                            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                                This action will be permanently logged
                            </p>
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
                        className="boc-input"
                        rows={4}
                        style={{ resize: "none" }}
                        placeholder={
                            isApprove
                                ? "e.g. All documents verified and face match confirmed"
                                : "e.g. NIC number mismatch with submitted documents"
                        }
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        autoFocus
                    />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        onClick={onClose}
                        style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #E2E8F0", background: "transparent", color: "#334155", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handle}
                        disabled={!reason.trim() || busy}
                        style={{
                            flex: 1, padding: "9px", borderRadius: 8, border: "none",
                            background: isApprove
                                ? "linear-gradient(135deg, #22C55E, #15803D)"
                                : "linear-gradient(135deg, #EF4444, #DC2626)",
                            color: "#fff", fontWeight: 700, fontSize: 13,
                            cursor: !reason.trim() || busy ? "not-allowed" : "pointer",
                            opacity: !reason.trim() || busy ? 0.5 : 1,
                            fontFamily: "Poppins, sans-serif",
                        }}
                    >
                        {busy ? "Processing…" : isApprove ? "Confirm Approve" : "Confirm Reject"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Tab content components ──────────────────────────────

function OverviewTab({ data }: { data: Detail }) {
    const c = data.customer ?? {};
    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <Field label="Full Name" value={c.name} />
                <Field label="NIC Number" value={c.nic} />
                <Field label="Date of Birth" value={formatDate(c.dob)} />
                <Field label="Age" value={c.age ? `${c.age} years` : null} />
                <Field label="Gender" value={c.gender} />
                <Field label="Phone" value={c.phone} />
                <Field label="Email" value={c.email} />
                <Field label="Account Purpose" value={c.purpose} />
                <Field label="Language" value={c.language} />
                <Field label="Submitted At" value={formatDateTime(data.created_at)} />
                <Field label="Status" value={data.status?.toUpperCase()} />
                <Field label="AI Confidence" value={data.ai_confidence_score != null ? `${(data.ai_confidence_score * 100).toFixed(1)}%` : null} />
            </div>
            {c.address && (
                <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Address</div>
                    <div style={{ fontWeight: 600, color: "#0A1628", fontSize: 13 }}>{c.address}</div>
                </div>
            )}
            {/* AI Score bar */}
            {data.ai_confidence_score != null && (
                <div style={{ marginTop: 16, background: "#F8FAFC", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>AI Confidence Score</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: data.ai_confidence_score >= 0.8 ? "#15803D" : data.ai_confidence_score >= 0.6 ? "#D97706" : "#DC2626", fontFamily: "Poppins, sans-serif" }}>
                            {(data.ai_confidence_score * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div style={{ background: "#E2E8F0", borderRadius: 4, height: 8 }}>
                        <div style={{
                            width: `${data.ai_confidence_score * 100}%`,
                            height: "100%",
                            borderRadius: 4,
                            background: data.ai_confidence_score >= 0.8
                                ? "linear-gradient(90deg, #22C55E, #15803D)"
                                : data.ai_confidence_score >= 0.6
                                    ? "linear-gradient(90deg, #F59E0B, #D97706)"
                                    : "linear-gradient(90deg, #EF4444, #DC2626)",
                            transition: "width 0.8s ease",
                        }} />
                    </div>
                </div>
            )}
            {data.rejection_reason && (
                <div style={{ marginTop: 16, padding: 14, background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#7F1D1D", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Rejection Reason</div>
                    <div style={{ color: "#7F1D1D", fontSize: 13 }}>{data.rejection_reason}</div>
                </div>
            )}
            {data.approval_reason && (
                <div style={{ marginTop: 16, padding: 14, background: "#DCFCE7", border: "1px solid #BBF7D0", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Approval Reason</div>
                    <div style={{ color: "#166534", fontSize: 13 }}>{data.approval_reason}</div>
                </div>
            )}
        </div>
    );
}

function OtpTab({ data }: { data: Detail }) {
    const otp = data.otp;
    const phone = otp?.phone ?? data.customer?.phone;
    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div style={{ background: otp?.verified ? "#DCFCE7" : "#FEE2E2", borderRadius: 10, padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 36 }}>{otp?.verified ? "✓" : "✗"}</div>
                    <div style={{ fontWeight: 700, color: otp?.verified ? "#166534" : "#7F1D1D", fontSize: 14, marginTop: 6 }}>
                        {otp?.verified ? "OTP Verified" : "Not Verified"}
                    </div>
                </div>
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Phone Number</div>
                    <div style={{ fontWeight: 700, color: "#0A1628", fontSize: 14 }}>{phone ?? "—"}</div>
                </div>
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Attempts</div>
                    <div style={{ fontWeight: 900, color: "#0A1628", fontSize: 28, fontFamily: "Poppins, sans-serif" }}>{otp?.attempts ?? 1}</div>
                </div>
            </div>
            <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>
                    OTP code: <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, letterSpacing: 4, color: "#0A1628" }}>••••••</span>
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 8 }}>
                    {otp?.sent_at ? `Sent at: ${formatDateTime(otp.sent_at)} · Expires 10 minutes from generation` : "OTP timing data not available"}
                </div>
            </div>
        </div>
    );
}

function DocumentsTab({ data }: { data: Detail }) {
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
            {data.documents.map((doc, i) => (
                <div key={i} style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ background: doc.verified ? "#DBEAFE" : "#F1F5F9", height: 130, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                        <span style={{ fontSize: 48 }}>🪪</span>
                        {doc.quality_score != null && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: doc.quality_score >= 80 ? "#15803D" : "#D97706" }}>
                                Quality: {doc.quality_score.toFixed(1)}%
                            </span>
                        )}
                    </div>
                    <div style={{ padding: 14 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#0A1628", textTransform: "capitalize", marginBottom: 8 }}>
                            {doc.doc_type?.replace(/_/g, " ")}
                        </div>
                        <span style={{ background: doc.verified ? "#DCFCE7" : "#F3F4F6", color: doc.verified ? "#14532D" : "#6B7280", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                            {doc.verified ? "✓ Verified" : "Unverified"}
                        </span>
                        {doc.file_url && (
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 11, color: "#2563EB", marginTop: 8 }}>
                                View document →
                            </a>
                        )}
                        {doc.ocr_data && Object.keys(doc.ocr_data).length > 0 && (
                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #E2E8F0" }}>
                                {Object.entries(doc.ocr_data).map(([k, v]) => (
                                    <div key={k} style={{ marginBottom: 4 }}>
                                        <span style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5 }}>{k.replace(/_/g, " ")}: </span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function BiometricsTab({ data }: { data: Detail }) {
    const b = data.biometrics;
    if (!b) {
        return (
            <div style={{ textAlign: "center", padding: 48, color: "#94A3B8" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                <div style={{ fontWeight: 600, color: "#334155" }}>No biometric data found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Biometric data will appear once AI processes the session</div>
            </div>
        );
    }
    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                {[
                    { label: "Selfie / Liveness", emoji: "🤳", bg: "#DBEAFE" },
                    { label: "NIC Photo", emoji: "🪪", bg: "#F0FDF4" },
                ].map((item) => (
                    <div key={item.label} style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{ background: item.bg, height: 160, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>
                            {item.emoji}
                        </div>
                        <div style={{ padding: 12 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#0A1628" }}>{item.label}</div>
                            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Captured during session</div>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                    {
                        label: "Face Match Score",
                        value: b.face_match_score != null ? `${(b.face_match_score * 100).toFixed(1)}%` : "—",
                        ok: (b.face_match_score ?? 0) >= 0.8,
                    },
                    {
                        label: "Liveness Result",
                        value: b.liveness_passed != null ? (b.liveness_passed ? "Pass" : "Fail") : "—",
                        ok: b.liveness_passed ?? false,
                    },
                    {
                        label: "Spoof Detection",
                        value: b.spoof_clear != null ? (b.spoof_clear ? "Clear" : "Flagged") : "Clear",
                        ok: b.spoof_clear ?? true,
                    },
                ].map((item) => (
                    <div key={item.label} style={{ background: item.ok ? "#DCFCE7" : "#FEE2E2", borderRadius: 8, padding: 16, textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: item.ok ? "#166534" : "#7F1D1D", fontFamily: "Poppins, sans-serif" }}>
                            {item.value}
                        </div>
                        <div style={{ fontSize: 11, color: item.ok ? "#166534" : "#7F1D1D", marginTop: 4 }}>
                            {item.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SignatureTab({ data }: { data: Detail }) {
    const s = data.signature;
    if (!s) {
        return (
            <div style={{ textAlign: "center", padding: 48, color: "#94A3B8" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✍️</div>
                <div style={{ fontWeight: 600, color: "#334155" }}>No signature found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Signature will appear once AI processes the session</div>
            </div>
        );
    }
    return (
        <div>
            <div style={{ border: "2px dashed #E2E8F0", borderRadius: 12, padding: 48, textAlign: "center", marginBottom: 16, background: "#FAFAFA" }}>
                <div style={{ fontSize: 64, marginBottom: 12 }}>✍️</div>
                <div style={{ fontStyle: "italic", fontSize: 36, fontFamily: "Poppins, sans-serif", color: "#0A1628" }}>
                    {data.customer?.name?.split(" ")[0]}
                </div>
            </div>
            <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#94A3B8" }}>
                <span>Type: <b style={{ color: "#334155" }}>{s.type ?? "Canvas (drawn)"}</b></span>
                <span>Captured: <b style={{ color: "#334155" }}>{formatDateTime(s.captured_at)}</b></span>
            </div>
        </div>
    );
}

function LogsTab({ data }: { data: Detail }) {
    if (!data.session_logs?.length) {
        return (
            <div style={{ textAlign: "center", padding: 48, color: "#94A3B8" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📜</div>
                <div style={{ fontWeight: 600, color: "#334155" }}>No session logs found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Logs will appear once AI processes the session</div>
            </div>
        );
    }
    return (
        <div style={{ position: "relative", paddingLeft: 24 }}>
            {data.session_logs.map((log, i) => {
                const dotColor =
                    log.result === "success" ? "#22C55E" :
                        log.result === "warning" ? "#F59E0B" : "#EF4444";
                return (
                    <div key={i} style={{ display: "flex", gap: 16, marginBottom: 14, position: "relative" }}>
                        <div style={{ position: "absolute", left: -22, top: 6, width: 10, height: 10, borderRadius: "50%", background: dotColor }} />
                        {i < data.session_logs!.length - 1 && (
                            <div style={{ position: "absolute", left: -18, top: 16, width: 2, height: "calc(100% + 4px)", background: "#E2E8F0" }} />
                        )}
                        <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 8, padding: "10px 14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontWeight: 700, fontSize: 13, color: "#0A1628" }}>{log.event}</span>
                                    {log.step && (
                                        <span style={{ background: "#E2E8F0", color: "#334155", padding: "1px 7px", borderRadius: 4, fontSize: 10 }}>
                                            {log.step}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    {log.score != null && (
                                        <span style={{ fontSize: 11, fontWeight: 700, color: "#0D9488" }}>Score: {log.score}</span>
                                    )}
                                    <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 11, color: "#94A3B8" }}>
                                        {formatDateTime(log.timestamp)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function AccountTab({ data }: { data: Detail }) {
    const a = data.account;
    if (!a) {
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
            <Field label="Account Number" value={a.account_number} />
            <Field label="Account Type" value={a.account_type} />
            <Field label="Branch" value={a.branch} />
            <Field label="Currency" value={a.currency ?? "LKR"} />
            <Field label="Created At" value={formatDateTime(a.created_at)} />
            <Field label="Status" value="Active" />
        </div>
    );
}

// ── Main page ──────────────────────────────────────────

export default function AppDetailPage() {
    const { sessionId } = useParams() as { sessionId: string };
    const router = useRouter();
    const { user } = useAuth();
    const [data, setData] = useState<Detail | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("overview");
    const [modal, setModal] = useState<"approve" | "reject" | null>(null);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const res = await applicationsApi.get(sessionId);
            const d = res.data;
            const c = d.customer || {};
            
            setData({
                session_id: c.session_id,
                status: c.verification_status,
                created_at: c.created_at,
                updated_at: c.updated_at,
                risk_score: c.risk_score ? parseFloat(c.risk_score) : undefined,
                customer: {
                    name: c.full_name,
                    nic: c.nic_number,
                    dob: c.date_of_birth,
                    age: c.age,
                    gender: c.gender,
                    phone: c.phone_number,
                    email: c.email,
                    address: c.address,
                    purpose: c.account_purpose,
                    language: d.sessions?.[0]?.language,
                },
                documents: d.documents?.map((doc: any) => ({
                    doc_type: doc.type,
                    file_url: doc.file_path,
                    verified: true,
                    quality_score: doc.quality_score ? parseFloat(doc.quality_score) : undefined,
                })),
                session_logs: d.logs?.map((log: any) => ({
                    event: log.action,
                    timestamp: log.timestamp,
                    step: log.step,
                    score: log.confidence_score ? parseFloat(log.confidence_score) : undefined,
                    result: log.result,
                })),
                account: d.accounts?.[0],
                signature: d.signatures?.[0],
                otp: {
                    verified: c.otp_verified,
                    attempts: c.otp_attempts,
                }
            } as Detail);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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

    const c = data.customer ?? {};
    const isPending = data.status === "pending" || data.status === "reviewing";

    return (
        <div style={{ maxWidth: 1100 }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: 28, right: 28, zIndex: 2000,
                    display: "flex", alignItems: "center", gap: 12,
                    background: toast.type === "success" ? "#0A1628" : "#7F1D1D",
                    color: "#fff", padding: "14px 20px", borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.25)", fontSize: 13,
                    fontWeight: 600, animation: "slideUp 0.3s ease",
                    fontFamily: "Poppins, sans-serif",
                }}>
                    <div style={{ width: 4, position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: "12px 0 0 12px", background: toast.type === "success" ? "#F5A800" : "#FCD34D" }} />
                    {toast.type === "success" ? "✓" : "⚠"} {toast.msg}
                </div>
            )}

            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13 }}>
                <button
                    onClick={() => router.back()}
                    style={{ background: "none", border: "none", color: "#2563EB", cursor: "pointer", fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 4, fontFamily: "Poppins, sans-serif" }}
                >
                    <ArrowLeft size={14} /> Applications
                </button>
                <span style={{ color: "#CBD5E1" }}>/</span>
                <span style={{ color: "#334155", fontWeight: 600 }}>
                    {data.session_id?.slice(0, 20)}…
                </span>
            </div>

            {/* Profile header */}
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "20px 24px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    {/* Avatar */}
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#F5A800", flexShrink: 0 }}>
                        {c.name?.charAt(0) ?? "?"}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                            <span style={{ fontSize: 20, fontWeight: 900, color: "#0A1628", fontFamily: "Poppins, sans-serif" }}>
                                {c.name ?? "—"}
                            </span>
                            <StatusBadge status={data.status} />
                            {data.risk_score != null && (
                                <span style={{
                                    background: data.risk_score >= 70 ? "#FEE2E2" : data.risk_score >= 40 ? "#FEF3C7" : "#DCFCE7",
                                    color: data.risk_score >= 70 ? "#7F1D1D" : data.risk_score >= 40 ? "#92400E" : "#14532D",
                                    padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                }}>
                                    {data.risk_score >= 70 ? "⚠ High Risk" : data.risk_score >= 40 ? "Medium Risk" : "Low Risk"} · {data.risk_score}
                                </span>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                            {[["NIC", c.nic], ["Language", c.language], ["Purpose", c.purpose]].map(([l, v]) => v && (
                                <span key={l} style={{ fontSize: 12, color: "#94A3B8" }}>
                                    {l}: <b style={{ color: "#334155" }}>{v}</b>
                                </span>
                            ))}
                            <span style={{ fontSize: 12, color: "#94A3B8" }}>
                                Submitted: <b style={{ color: "#334155" }}>{formatDateTime(data.created_at)}</b>
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    {isPending && user && (
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={() => setModal("reject")}
                                style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "Poppins, sans-serif" }}
                            >
                                <XCircle size={14} /> Reject
                            </button>
                            <button
                                onClick={() => setModal("approve")}
                                style={{ background: "linear-gradient(135deg, #22C55E, #15803D)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "Poppins, sans-serif" }}
                            >
                                <CheckCircle size={14} /> Approve
                            </button>
                        </div>
                    )}

                    {!isPending && (
                        <div style={{ background: data.status === "approved" ? "#DCFCE7" : "#FEE2E2", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: data.status === "approved" ? "#166534" : "#7F1D1D" }}>
                            {data.status === "approved" ? "✓ Application Approved" : "✗ Application Rejected"}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 4, width: "fit-content", flexWrap: "wrap" }}>
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`tab-btn${tab === t.id ? " active" : ""}`}
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                        <t.icon size={13} />
                        {t.label}
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

            {/* Modal */}
            {modal && (
                <ActionModal
                    type={modal}
                    onClose={() => setModal(null)}
                    onConfirm={(reason) => handleAction(modal, reason)}
                />
            )}
        </div>
    );
}