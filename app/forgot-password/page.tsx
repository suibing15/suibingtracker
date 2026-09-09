"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import ThemeToggle from "@/components/ThemeToggle";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "ok" | "error"; msg?: string }>({
    kind: "idle",
  });

  async function handleSend() {
    if (!email.trim()) {
      setStatus({ kind: "error", msg: "Enter your email address." });
      return;
    }
    setStatus({ kind: "busy" });
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setStatus({ kind: "error", msg: error.message });
      return;
    }
    setStatus({
      kind: "ok",
      msg: "If that email has an account, a reset link is on its way — check your inbox (and spam folder).",
    });
  }

  if (!isConfigured) {
    return (
      <main className="auth-wrap">
        <div className="auth-card">
          <p>Connect Supabase (env vars) before requesting a reset.</p>
        </div>
        <style jsx>{authStyles}</style>
      </main>
    );
  }

  return (
    <main className="auth-wrap">
      <div className="toggle-corner"><ThemeToggle /></div>
      <div className="auth-card">
        <span className="eyebrow">Password reset</span>
        <h1>Forgot your password?</h1>
        <p className="hint">Enter the email on your account and we'll send you a link to set a new one.</p>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
        </label>

        <button className="primary-btn" onClick={handleSend} disabled={status.kind === "busy"}>
          {status.kind === "busy" ? "Sending…" : "Send reset link"}
        </button>
        {status.msg && <p className={`msg ${status.kind === "error" ? "error" : "ok"}`}>{status.msg}</p>}

        <p className="footnote">
          <Link href="/login">← Back to sign in</Link>
        </p>
      </div>
      <style jsx>{authStyles}</style>
    </main>
  );
}

const authStyles = `
  .auth-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    position: relative;
  }
  .toggle-corner {
    position: absolute;
    top: 20px;
    right: 20px;
  }
  .auth-card {
    width: 100%;
    max-width: 420px;
    background: linear-gradient(180deg, var(--ink-2), var(--ink));
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    padding: 32px;
    box-shadow: var(--shadow);
  }
  .eyebrow {
    font-family: var(--font-display);
    font-size: 11px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--amber);
  }
  h1 {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 700;
    margin-top: 8px;
  }
  .hint {
    color: var(--text-dim);
    font-size: 13px;
    line-height: 1.6;
    margin-top: 10px;
    margin-bottom: 22px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 14px;
  }
  .field span {
    font-size: 12px;
    color: var(--text-dim);
    font-weight: 500;
  }
  input {
    background: var(--ink);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    color: var(--text);
    padding: 12px 14px;
    font-size: 15px;
    width: 100%;
  }
  input:focus {
    outline: none;
    border-color: var(--amber);
    box-shadow: 0 0 0 3px rgba(232, 163, 61, 0.18);
  }
  .primary-btn {
    width: 100%;
    background: var(--amber);
    color: #201603;
    border: none;
    border-radius: var(--radius-sm);
    padding: 13px 26px;
    font-weight: 600;
    font-size: 15px;
    font-family: var(--font-display);
    margin-top: 8px;
  }
  .primary-btn:disabled {
    opacity: 0.6;
  }
  .msg {
    margin-top: 14px;
    font-size: 13px;
    line-height: 1.5;
  }
  .msg.error {
    color: var(--coral);
  }
  .msg.ok {
    color: var(--mint);
  }
  .footnote {
    margin-top: 20px;
    font-size: 12px;
    color: var(--text-faint);
  }
  .footnote :global(a) {
    color: var(--amber);
    text-decoration: none;
    font-weight: 600;
  }
`;
