"use client";

import { useEffect, useState, useCallback } from "react";
import { usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
    Search,
    Plus,
    X,
    AlertCircle,
    Eye,
    EyeOff,
    Shield,
    ToggleLeft,
    ToggleRight,
    UserX,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

interface AdminUser {
    id: number;
    employee_id: string;
    bank_id: string;
    full_name: string;
    email: string;
    role: string;
    branch: string;
    is_active: boolean;
    force_password_reset: boolean;
    last_login?: string;
    created_at: string;
    created_by?: string;
}

const ROLE_DISPLAY: Record<string, { label: string; bg: string; color: string; border: string }> = {
    super_admin: { label: "Super Admin", bg: "#EDE9FE", color: "#4C1D95", border: "#C4B5FD" },
    admin: { label: "Admin", bg: "#DBEAFE", color: "#1E3A8A", border: "#93C5FD" },
    user: { label: "KYC Officer", bg: "#FFF3CC", color: "#C98B00", border: "#FFE082" },
};

function CreateUserModal({
    onClose,
    onSuccess,
}: {
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [form, setForm] = useState({
        full_name: "",
        email: "",
        short_id: "",
        bank_id: "",
        branch: "",
        role: "user",
        password: "",
    });
    const [showPw, setShowPw] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    function set(field: string, val: string) {
        setForm((f) => ({ ...f, [field]: val }));
    }

    async function handle() {
        if (!form.full_name || !form.email || !form.short_id || !form.bank_id || !form.branch || !form.password) {
            setError("All fields are required");
            return;
        }
        setBusy(true);
        try {
            await usersApi.create(form);
            onSuccess();
            onClose();
        } catch (err: unknown) {
            setError(
                (err as { response?: { data?: { detail?: string } } })
                    ?.response?.data?.detail ?? "Failed to create user"
            );
        } finally {
            setBusy(false);
        }
    }

    const rolePrefix = form.role === "admin" ? "ADM" : "USR";

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 32,
                    width: 520,
                    boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
                    maxHeight: "90vh",
                    overflowY: "auto",
                }}
            >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ padding: 10, borderRadius: 10, background: "#DBEAFE" }}>
                            <Shield size={20} color="#1E3A8A" />
                        </div>
                        <div>
                            <h3 style={{ fontFamily: "Poppins, sans-serif", fontSize: 16, fontWeight: 800, color: "#0A1628" }}>
                                Create New User
                            </h3>
                            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                                Employee ID will be auto-generated
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: "#F1F5F9", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Form grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                    {/* Full name */}
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                            Full Name <span style={{ color: "#DC2626" }}>*</span>
                        </label>
                        <input
                            className="boc-input"
                            placeholder="e.g. Kavindra Jayasuriya"
                            value={form.full_name}
                            onChange={(e) => set("full_name", e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Email */}
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                            Email <span style={{ color: "#DC2626" }}>*</span>
                        </label>
                        <input
                            type="email"
                            className="boc-input"
                            placeholder="e.g. k.jayasuriya@boc.lk"
                            value={form.email}
                            onChange={(e) => set("email", e.target.value)}
                        />
                    </div>

                    {/* Short ID */}
                    <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                            Short ID <span style={{ color: "#DC2626" }}>*</span>
                        </label>
                        <input
                            className="boc-input"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                            placeholder="e.g. kyc001"
                            value={form.short_id}
                            onChange={(e) => set("short_id", e.target.value)}
                        />
                        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                            Used by the user to log in
                        </p>
                    </div>

                    {/* Bank ID */}
                    <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                            Bank Staff ID <span style={{ color: "#DC2626" }}>*</span>
                        </label>
                        <input
                            className="boc-input"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                            placeholder="e.g. 1234"
                            value={form.bank_id}
                            onChange={(e) => set("bank_id", e.target.value)}
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                            Role <span style={{ color: "#DC2626" }}>*</span>
                        </label>
                        <select
                            className="boc-input"
                            value={form.role}
                            onChange={(e) => set("role", e.target.value)}
                            style={{ cursor: "pointer" }}
                        >
                            <option value="user">KYC Officer</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {/* Branch */}
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                            Branch <span style={{ color: "#DC2626" }}>*</span>
                        </label>
                        <input
                            className="boc-input"
                            placeholder="e.g. Colombo Main"
                            value={form.branch}
                            onChange={(e) => set("branch", e.target.value)}
                        />
                    </div>

                    {/* Password */}
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                            Initial Password <span style={{ color: "#DC2626" }}>*</span>
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPw ? "text" : "password"}
                                className="boc-input"
                                style={{ paddingRight: 42 }}
                                placeholder="Min 8 chars, uppercase, number, special"
                                value={form.password}
                                onChange={(e) => set("password", e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPw)}
                                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
                            >
                                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 5 }}>
                            User will be forced to change on first login
                        </p>
                    </div>
                </div>

                {/* Employee ID preview */}
                <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
                    <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                        Employee ID Preview
                    </div>
                    <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 13, color: "#2563EB" }}>
                        {rolePrefix}-{form.bank_id || "????"}
                        <span style={{ color: "#94A3B8" }}>-xxxx-xxxx-xxxx</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                        UUID segment auto-generated on save
                    </div>
                    {form.short_id && (
                        <div style={{ marginTop: 8, fontSize: 12 }}>
                            Login Short ID:{" "}
                            <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0A1628" }}>
                                {form.short_id}
                            </span>
                        </div>
                    )}
                </div>

                {error && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#DC2626", fontSize: 13, marginBottom: 16 }}>
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        onClick={onClose}
                        style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #E2E8F0", background: "transparent", color: "#334155", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handle}
                        disabled={busy}
                        style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #0A1628, #1B3A6B)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, fontFamily: "Poppins, sans-serif" }}
                    >
                        {busy ? "Creating…" : "Create User"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditUserModal({
    user,
    onClose,
    onSuccess,
}: {
    user: AdminUser;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [form, setForm] = useState({
        full_name: user.full_name,
        branch: user.branch,
        role: user.role,
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    function set(field: string, val: string) {
        setForm((f) => ({ ...f, [field]: val }));
    }

    async function handle() {
        setBusy(true);
        try {
            await usersApi.update(user.employee_id, form);
            onSuccess();
            onClose();
        } catch (err: unknown) {
            setError(
                (err as { response?: { data?: { detail?: string } } })
                    ?.response?.data?.detail ?? "Failed to update user"
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{ background: "#fff", borderRadius: 16, padding: 32, width: 480, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h3 style={{ fontFamily: "Poppins, sans-serif", fontSize: 16, fontWeight: 800, color: "#0A1628" }}>
                        Edit: {user.full_name}
                    </h3>
                    <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={14} />
                    </button>
                </div>

                {/* Read only info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                    {[
                        ["Employee ID", user.employee_id],
                        ["Email", user.email],
                        ["Bank ID", user.bank_id],
                        ["Created At", formatDate(user.created_at)],
                    ].map(([l, v]) => (
                        <div key={l} style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 12px" }}>
                            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{l}</div>
                            <div style={{ fontWeight: 600, color: "#0A1628", fontSize: 12, fontFamily: l === "Employee ID" || l === "Bank ID" ? "Poppins, sans-serif" : "inherit" }}>{v}</div>
                        </div>
                    ))}
                </div>

                {/* Editable fields */}
                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Full Name</label>
                    <input className="boc-input" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Branch</label>
                    <input className="boc-input" value={form.branch} onChange={(e) => set("branch", e.target.value)} />
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Role</label>
                    <select className="boc-input" value={form.role} onChange={(e) => set("role", e.target.value)} style={{ cursor: "pointer" }}>
                        <option value="user">KYC Officer</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                {error && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#DC2626", fontSize: 13, marginBottom: 16 }}>
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #E2E8F0", background: "transparent", color: "#334155", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                        Cancel
                    </button>
                    <button onClick={handle} disabled={busy} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #0A1628, #1B3A6B)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, fontFamily: "Poppins, sans-serif" }}>
                        {busy ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function UsersPage() {
    const { isSuperAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editUser, setEditUser] = useState<AdminUser | null>(null);
    const [toggling, setToggling] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    // Redirect if not super admin
    useEffect(() => {
        if (!authLoading && !isSuperAdmin) {
            router.replace("/");
        }
    }, [authLoading, isSuperAdmin, router]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await usersApi.list();
            const all: AdminUser[] = res.data ?? [];
            const filtered = search
                ? all.filter(
                    (u) =>
                        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase()) ||
                        u.employee_id.toLowerCase().includes(search.toLowerCase())
                )
                : all;
            setUsers(filtered);
        } catch (e) {
            console.error(e);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        if (isSuperAdmin) {
            const t = setTimeout(fetchData, 300);
            return () => clearTimeout(t);
        }
    }, [fetchData, isSuperAdmin]);

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3500);
            return () => clearTimeout(t);
        }
    }, [toast]);

    async function handleToggleActive(user: AdminUser) {
        setToggling(user.employee_id);
        try {
            await usersApi.update(user.employee_id, {
                is_active: !user.is_active,
            });
            setToast({
                type: "success",
                msg: `${user.full_name} ${user.is_active ? "deactivated" : "activated"}`,
            });
            fetchData();
        } catch {
            setToast({ type: "error", msg: "Failed to update user" });
        } finally {
            setToggling(null);
        }
    }

    async function handleDeactivate(user: AdminUser) {
        if (!confirm(`Deactivate ${user.full_name}? They will no longer be able to log in.`)) return;
        try {
            await usersApi.delete(user.employee_id);
            setToast({ type: "success", msg: `${user.full_name} deactivated` });
            fetchData();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to deactivate";
            setToast({ type: "error", msg });
        }
    }

    if (!isSuperAdmin && !authLoading) return null;

    // Stats
    const total = users.length;
    const active = users.filter((u) => u.is_active).length;
    const inactive = users.filter((u) => !u.is_active).length;

    return (
        <div style={{ maxWidth: 1200 }}>
            {/* Toast */}
            {toast && (
                <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 2000, display: "flex", alignItems: "center", gap: 12, background: toast.type === "success" ? "#0A1628" : "#7F1D1D", color: "#fff", padding: "14px 20px", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", fontSize: 13, fontWeight: 600, fontFamily: "Poppins, sans-serif" }}>
                    <div style={{ width: 4, position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: "12px 0 0 12px", background: "#F5A800" }} />
                    {toast.type === "success" ? "✓" : "⚠"} {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0A1628", fontFamily: "Poppins, sans-serif", letterSpacing: -0.5 }}>
                        User Management
                    </h1>
                    <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 3 }}>
                        Manage admin panel access · Super Admin only
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "linear-gradient(135deg, #F5A800, #C98B00)", color: "#0A1628", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}
                >
                    <Plus size={14} /> Add User
                </button>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 22 }}>
                {[
                    { label: "Total Users", value: total, color: "#2563EB", bg: "#DBEAFE" },
                    { label: "Active", value: active, color: "#15803D", bg: "#DCFCE7" },
                    { label: "Inactive", value: inactive, color: "#DC2626", bg: "#FEE2E2" },
                ].map((s) => (
                    <div key={s.label} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: s.color, fontFamily: "Poppins, sans-serif" }}>
                            {s.value}
                        </div>
                        <div style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ position: "relative", maxWidth: 360, marginBottom: 18 }}>
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                <input
                    className="boc-input"
                    style={{ paddingLeft: 34 }}
                    placeholder="Search by name, email or ID…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
                <div style={{ overflowX: "auto" }}>
                    <table className="boc-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Employee ID</th>
                                <th>Role</th>
                                <th>Branch</th>
                                <th>Last Login</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j}>
                                                <div style={{ height: 12, background: "#F1F5F9", borderRadius: 4, width: "70%", animation: "pulse 1.5s ease-in-out infinite" }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8" }}>
                                        <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                                        <div style={{ fontWeight: 600, color: "#334155", fontSize: 14 }}>No users found</div>
                                        <div style={{ fontSize: 12, marginTop: 4 }}>
                                            Click "Add User" to create the first user
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => {
                                    const roleStyle = ROLE_DISPLAY[u.role] ?? ROLE_DISPLAY.user;
                                    return (
                                        <tr key={u.employee_id}>
                                            {/* Employee */}
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: u.is_active ? "#0A1628" : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: u.is_active ? "#F5A800" : "#94A3B8", flexShrink: 0 }}>
                                                        {u.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: "#0A1628", fontSize: 13 }}>{u.full_name}</div>
                                                        <div style={{ fontSize: 11, color: "#94A3B8" }}>{u.email}</div>
                                                        {u.force_password_reset && (
                                                            <div style={{ fontSize: 10, color: "#D97706", fontWeight: 600 }}>⚠ Awaiting password reset</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Employee ID */}
                                            <td>
                                                <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 11, color: "#94A3B8" }}>
                                                    {u.employee_id}
                                                </span>
                                            </td>

                                            {/* Role */}
                                            <td>
                                                <span style={{ background: roleStyle.bg, color: roleStyle.color, border: `1px solid ${roleStyle.border}`, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                                                    {roleStyle.label}
                                                </span>
                                            </td>

                                            {/* Branch */}
                                            <td style={{ fontSize: 12, color: "#334155" }}>{u.branch}</td>

                                            {/* Last login */}
                                            <td style={{ fontSize: 12, color: "#94A3B8" }}>
                                                {u.last_login ? formatDateTime(u.last_login) : "Never"}
                                            </td>

                                            {/* Status */}
                                            <td>
                                                <button
                                                    onClick={() => handleToggleActive(u)}
                                                    disabled={toggling === u.employee_id}
                                                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: toggling === u.employee_id ? 0.5 : 1 }}
                                                >
                                                    {u.is_active
                                                        ? <ToggleRight size={22} color="#15803D" />
                                                        : <ToggleLeft size={22} color="#94A3B8" />}
                                                    <span style={{ fontSize: 12, fontWeight: 600, color: u.is_active ? "#15803D" : "#94A3B8" }}>
                                                        {u.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td>
                                                <div style={{ display: "flex", gap: 6 }}>
                                                    <button
                                                        onClick={() => setEditUser(u)}
                                                        style={{ background: "#DBEAFE", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#1E3A8A", fontFamily: "Poppins, sans-serif" }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeactivate(u)}
                                                        style={{ background: "#FEE2E2", border: "none", borderRadius: 6, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#DC2626", fontFamily: "Poppins, sans-serif" }}
                                                    >
                                                        <UserX size={12} /> Deactivate
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Permissions matrix */}
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0A1628", fontFamily: "Poppins, sans-serif", marginBottom: 18 }}>
                    Role Permissions Matrix
                </h2>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr>
                                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#94A3B8", fontSize: 11, letterSpacing: 0.5, borderBottom: "1px solid #E2E8F0" }}>
                                    Permission
                                </th>
                                {["KYC Officer", "Admin", "Super Admin"].map((r) => (
                                    <th key={r} style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#94A3B8", fontSize: 11, letterSpacing: 0.5, borderBottom: "1px solid #E2E8F0" }}>
                                        {r}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { perm: "View Applications", officer: true, admin: true, super: true },
                                { perm: "Approve Applications", officer: false, admin: true, super: true },
                                { perm: "Reject Applications", officer: false, admin: true, super: true },
                                { perm: "Add to Watchlist", officer: false, admin: true, super: true },
                                { perm: "Remove from Watchlist", officer: false, admin: false, super: true },
                                { perm: "Export CSV", officer: false, admin: true, super: true },
                                { perm: "Create/Manage Users", officer: false, admin: false, super: true },
                                { perm: "View Audit Logs", officer: true, admin: true, super: true },
                            ].map((row, i) => (
                                <tr key={row.perm} style={{ background: i % 2 === 0 ? "#fff" : "#FAFBFF", borderBottom: "1px solid #E2E8F0" }}>
                                    <td style={{ padding: "10px 14px", color: "#334155", fontWeight: 500 }}>
                                        {row.perm}
                                    </td>
                                    {[row.officer, row.admin, row.super].map((has, j) => (
                                        <td key={j} style={{ padding: "10px 14px", textAlign: "center" }}>
                                            {has
                                                ? <span style={{ color: "#15803D", fontSize: 18, fontWeight: 700 }}>✓</span>
                                                : <span style={{ color: "#CBD5E1", fontSize: 16 }}>—</span>}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showCreate && (
                <CreateUserModal
                    onClose={() => setShowCreate(false)}
                    onSuccess={fetchData}
                />
            )}

            {editUser && (
                <EditUserModal
                    user={editUser}
                    onClose={() => setEditUser(null)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
}