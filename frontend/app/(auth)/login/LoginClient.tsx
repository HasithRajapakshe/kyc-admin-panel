"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { Eye, EyeOff, ShieldCheck, AlertCircle, Lock } from "lucide-react";

export default function LoginClient() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const isReset = params.get("reset") === "1";

  // Login fields
  const [shortId, setShortId] = useState("");
  const [password, setPassword]     = useState("");
  const [showPass, setShowPass]     = useState(false);

  // Reset fields
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [showNew, setShowNew]       = useState(false);

  const [error, setError] = useState("");
  const [busy, setBusy]   = useState(false);

  useEffect(() => {
    if (!loading && user && !user.force_password_reset) {
      router.replace("/");
    }
  }, [user, loading, router]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(shortId.trim(), password);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })
          ?.response?.data?.detail ?? "Invalid credentials";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (newPw !== confirmPw) {
      setError("Passwords do not match");
      return;
    }
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(newPw)) {
      setError(
        "Min 8 chars · one uppercase · one number · one special character"
      );
      return;
    }
    setBusy(true);
    try {
      await authApi.changePassword(currentPw, newPw);
      router.replace("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })
          ?.response?.data?.detail ?? "Failed to change password";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A1628",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* ── Left Panel — BOC Navy ── */}
      <div
        style={{
          width: "42%",
          background: "#0A1628",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "40px 48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gold top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 4,
            background: "linear-gradient(90deg, #F5A800, #C98B00)",
          }}
        />

        {/* Decorative circles */}
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", border: "1px solid rgba(245,168,0,0.1)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 200, height: 200, borderRadius: "50%", border: "1px solid rgba(245,168,0,0.07)" }} />

        <div>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 52, height: 52, borderRadius: 12,
                background: "linear-gradient(135deg, #F5A800, #C98B00)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 28, fontWeight: 900, color: "#0A1628",
                  fontFamily: "Georgia, serif", letterSpacing: -1,
                }}
              >
                B
              </span>
            </div>
            <div>
              <div
                style={{
                  fontWeight: 900, fontSize: 18, color: "#fff",
                  fontFamily: "Georgia, serif", letterSpacing: -0.5,
                }}
              >
                Bank of Ceylon
              </div>
              <div
                style={{
                  fontSize: 10, color: "#F5A800",
                  letterSpacing: 2, textTransform: "uppercase", fontWeight: 600,
                }}
              >
                KYC Admin Portal
              </div>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginTop: 56 }}>
            <h1
              style={{
                fontSize: 32, fontWeight: 900, color: "#fff",
                fontFamily: "Georgia, serif", lineHeight: 1.2, letterSpacing: -0.5,
              }}
            >
              Digital KYC<br />Administration
            </h1>
            <p style={{ fontSize: 14, color: "#64748B", marginTop: 14, lineHeight: 1.7 }}>
              Secure onboarding management for authorised Bank of Ceylon personnel only.
            </p>
          </div>

          {/* Features */}
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "🏛️", text: "CBSL & FIU-SL Compliant" },
              { icon: "🔒", text: "Role-based access control" },
              { icon: "📋", text: "Full audit trail on all actions" },
              { icon: "🤖", text: "AI-powered risk screening" },
            ].map((f) => (
              <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span style={{ fontSize: 13, color: "#94A3B8" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["CBSL", "FIU-SL", "FATF", "PDPA"].map((b) => (
            <span
              key={b}
              style={{
                background: "rgba(245,168,0,0.12)",
                border: "1px solid rgba(245,168,0,0.25)",
                color: "#F5A800",
                padding: "4px 12px", borderRadius: 20,
                fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
              }}
            >
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div
        style={{
          flex: 1,
          background: "#F4F6FA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>

          {isReset ? (
            /* ── Force password reset form ── */
            <>
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ padding: 8, borderRadius: 8, background: "#FEF3C7", border: "1px solid #FCD34D" }}>
                    <Lock size={18} color="#D97706" />
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0A1628", fontFamily: "Georgia, serif" }}>
                    Set new password
                  </h2>
                </div>
                <p style={{ fontSize: 13, color: "#94A3B8" }}>
                  You must change your password before continuing.
                </p>
              </div>

              <form
                onSubmit={handleReset}
                style={{
                  background: "#fff", borderRadius: 16, padding: 32,
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                }}
              >
                {/* Current password */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                    Current password <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="password"
                    className="boc-input"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {/* New password */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                    New password <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNew ? "text" : "password"}
                      className="boc-input"
                      style={{ paddingRight: 42 }}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 5 }}>
                    Min 8 chars · one uppercase · one number · one special character
                  </p>
                </div>

                {/* Confirm password */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                    Confirm new password <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="password"
                    className="boc-input"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#DC2626", fontSize: 13, marginBottom: 16 }}>
                    <AlertCircle size={14} />{error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="boc-btn"
                  style={{
                    width: "100%", padding: "11px", borderRadius: 9, border: "none",
                    background: "linear-gradient(135deg, #F5A800, #C98B00)",
                    color: "#0A1628", fontWeight: 700, fontSize: 14,
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  {busy ? "Saving…" : "Set new password"}
                </button>
              </form>
            </>
          ) : (
            /* ── Login form ── */
            <>
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <ShieldCheck size={22} color="#F5A800" />
                  <h2 style={{ fontSize: 26, fontWeight: 900, color: "#0A1628", fontFamily: "Georgia, serif" }}>
                    Sign in
                  </h2>
                </div>
                <p style={{ fontSize: 13, color: "#94A3B8" }}>
                  Authorised personnel only. All access is logged.
                </p>
              </div>

              <form
                onSubmit={handleLogin}
                style={{
                  background: "#fff", borderRadius: 16, padding: 32,
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                }}
              >
                {/* Employee ID */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                    Employee Short ID <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="boc-input"
                    style={{ fontFamily: "monospace" }}
                    placeholder="e.g. sad001"
                    value={shortId}
                    onChange={(e) => setShortId(e.target.value)}
                    required
                    autoFocus
                    autoComplete="username"
                  />
                </div>

                {/* Password */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                    Password <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPass ? "text" : "password"}
                      className="boc-input"
                      style={{ paddingRight: 42 }}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#DC2626", fontSize: 13, marginBottom: 16 }}>
                    <AlertCircle size={14} />{error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="boc-btn"
                  style={{
                    width: "100%", padding: "12px", borderRadius: 9, border: "none",
                    background: "linear-gradient(135deg, #F5A800, #C98B00)",
                    color: "#0A1628", fontWeight: 800, fontSize: 14,
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.7 : 1,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {busy ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={{ width: 14, height: 14, border: "2px solid rgba(10,22,40,0.3)", borderTopColor: "#0A1628", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                      Signing in…
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>

                <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#94A3B8" }}>
                  Secured by TLS 1.3 · AES-256 encryption at rest
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}