"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isConfigured } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const { loading, session, superAdminExists, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "error"; msg?: string }>({
    kind: "idle",
  });

  useEffect(() => {
    if (loading) return;
    if (session) {
      router.replace("/");
    } else if (superAdminExists === false) {
      router.replace("/setup");
    }
  }, [loading, session, superAdminExists, router]);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setStatus({ kind: "error", msg: "Enter your email and password." });
      return;
    }
    setStatus({ kind: "busy" });
    const { error } = await signIn(email.trim(), password);
    if (error) {
      setStatus({ kind: "error", msg: error });
      return;
    }
    router.replace("/");
  }

  if (!isConfigured) {
    return (
      <main className="auth-wrap">
        <div className="auth-card">
          <p>Connect Supabase (env vars) before signing in.</p>
        </div>
        <style jsx>{authStyles}</style>
      </main>
    );
  }

  return (
    <main className="auth-wrap">
      <div className="toggle-corner"><ThemeToggle /></div>
      <div className="auth-card">
        <span className="mark">◈</span>
        <h1>suibingtracker</h1>
        <p className="hint">Sign in with the account your admin set up for you.</p>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
          />
        </label>

        <button className="primary-btn" onClick={handleSignIn} disabled={status.kind === "busy"}>
          {status.kind === "busy" ? "Signing in…" : "Sign in"}
        </button>
        {status.msg && <p className={`msg ${status.kind}`}>{status.msg}</p>}

        <p className="footnote">
          New here? <Link href="/signup">Create a free account</Link> — or ask
          your admin to set one up for you.
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
    max-width: 400px;
    background: linear-gradient(180deg, var(--ink-2), var(--ink));
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    padding: 32px;
    box-shadow: var(--shadow);
    text-align: center;
  }
  .mark {
    font-size: 30px;
    color: var(--amber);
  }
  h1 {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    margin-top: 8px;
  }
  .hint {
    color: var(--text-dim);
    font-size: 13px;
    margin-top: 8px;
    margin-bottom: 22px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 14px;
    text-align: left;
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
