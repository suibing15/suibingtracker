"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";

export default function SetupPage() {
  const router = useRouter();
  const { loading, superAdminExists, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "error"; msg?: string }>({
    kind: "idle",
  });

  useEffect(() => {
    if (!loading && superAdminExists) {
      router.replace("/login");
    }
  }, [loading, superAdminExists, router]);

  async function handleSetup() {
    if (!email.trim() || password.length < 8) {
      setStatus({ kind: "error", msg: "Enter an email and a password of at least 8 characters." });
      return;
    }
    setStatus({ kind: "busy" });

    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password, fullName: fullName.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus({ kind: "error", msg: body.error ?? "Could not create the super admin account." });
      return;
    }

    // The account now exists and is confirmed server-side; sign in from the
    // browser to establish this session.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setStatus({ kind: "error", msg: signInError.message });
      return;
    }

    await refreshProfile();
    router.replace("/");
  }

  if (!isConfigured) {
    return (
      <main className="auth-wrap">
        <div className="auth-card">
          <p>Connect Supabase (env vars) before running setup.</p>
        </div>
        <style jsx>{authStyles}</style>
      </main>
    );
  }

  return (
    <main className="auth-wrap">
      <div className="toggle-corner"><ThemeToggle /></div>
      <div className="auth-card">
        <span className="eyebrow">One-time setup</span>
        <h1>Create the super admin</h1>
        <p className="hint">
          This runs once. The first account created here can manage every other
          user — create accounts, control what they see, and set spend limits.
        </p>

        <label className="field">
          <span>Full name</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Sulaiman" />
        </label>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            onKeyDown={(e) => e.key === "Enter" && handleSetup()}
          />
        </label>

        <button className="primary-btn" onClick={handleSetup} disabled={status.kind === "busy"}>
          {status.kind === "busy" ? "Setting up…" : "Create super admin"}
        </button>
        {status.msg && <p className={`msg ${status.kind}`}>{status.msg}</p>}
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
`;
