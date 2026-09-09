"use client";

import { useState } from "react";
import { supabase, Profile } from "@/lib/supabaseClient";
import CollapsibleCard from "./CollapsibleCard";

type Props = { profile: Profile };

export default function MyAccountCard({ profile }: Props) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwStatus, setPwStatus] = useState<{ kind: "idle" | "busy" | "ok" | "error"; msg?: string }>({
    kind: "idle",
  });

  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [recStatus, setRecStatus] = useState<{ kind: "idle" | "busy" | "ok" | "error"; msg?: string }>({
    kind: "idle",
  });

  async function changePassword() {
    if (!currentPw || newPw.length < 8) {
      setPwStatus({ kind: "error", msg: "Enter your current password and a new one of at least 8 characters." });
      return;
    }
    setPwStatus({ kind: "busy" });

    // Verify the current password is actually correct before changing it.
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPw,
    });
    if (verifyErr) {
      setPwStatus({ kind: "error", msg: "Current password is incorrect." });
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
    if (updateErr) {
      setPwStatus({ kind: "error", msg: updateErr.message });
      return;
    }
    setCurrentPw("");
    setNewPw("");
    setPwStatus({ kind: "ok", msg: "Password updated." });
  }

  async function submitRecommendation() {
    if (!message.trim()) {
      setRecStatus({ kind: "error", msg: "Write a message before sending." });
      return;
    }
    setRecStatus({ kind: "busy" });
    const { error } = await supabase.from("recommendations").insert({
      user_id: profile.id,
      message: message.trim(),
      rating,
    });
    if (error) {
      setRecStatus({ kind: "error", msg: error.message });
      return;
    }
    setMessage("");
    setRating(null);
    setRecStatus({ kind: "ok", msg: "Thanks — sent to the admin." });
  }

  return (
    <CollapsibleCard eyebrow="You" title="My account" subtitle="Change your password, or send a suggestion to the admin." defaultOpen={false}>
      <div className="section">
        <h3>Change password</h3>
        <div className="row">
          <label className="field">
            <span>Current password</span>
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" />
          </label>
          <label className="field">
            <span>New password</span>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="At least 8 characters"
            />
          </label>
        </div>
        <button className="primary-btn" onClick={changePassword} disabled={pwStatus.kind === "busy"}>
          {pwStatus.kind === "busy" ? "Updating…" : "Update password"}
        </button>
        {pwStatus.msg && <p className={`msg ${pwStatus.kind}`}>{pwStatus.msg}</p>}
      </div>

      <div className="section">
        <h3>Send a recommendation</h3>
        <p className="hint">Tell the admin what's working, what's missing, or what would make this better for you.</p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What would you like to see?"
          rows={3}
        />
        <div className="rating-row">
          <span className="rating-label">How much are you enjoying the app?</span>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`star ${rating != null && n <= rating ? "on" : ""}`}
                onClick={() => setRating(n === rating ? null : n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                type="button"
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <button className="primary-btn" onClick={submitRecommendation} disabled={recStatus.kind === "busy"}>
          {recStatus.kind === "busy" ? "Sending…" : "Send to admin"}
        </button>
        {recStatus.msg && <p className={`msg ${recStatus.kind}`}>{recStatus.msg}</p>}
      </div>

      <style jsx>{`
        .section {
          padding: 20px 0;
        }
        .section:first-child {
          padding-top: 0;
        }
        .section + .section {
          border-top: 1px solid var(--line);
        }
        h3 {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 14px;
        }
        .hint {
          color: var(--text-faint);
          font-size: 12px;
          margin-bottom: 12px;
          margin-top: -6px;
        }
        .row {
          display: flex;
          gap: 12px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-width: 180px;
        }
        .field span {
          font-size: 12px;
          color: var(--text-dim);
        }
        input,
        textarea {
          background: var(--ink);
          border: 1px solid var(--line-strong);
          border-radius: var(--radius-sm);
          color: var(--text);
          padding: 11px 13px;
          font-size: 14px;
          font-family: inherit;
          width: 100%;
          resize: vertical;
        }
        input:focus,
        textarea:focus {
          outline: none;
          border-color: var(--amber);
        }
        .rating-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 14px 0;
          flex-wrap: wrap;
        }
        .rating-label {
          font-size: 12px;
          color: var(--text-dim);
        }
        .stars {
          display: flex;
          gap: 4px;
        }
        .star {
          background: transparent;
          border: none;
          font-size: 20px;
          color: var(--line-strong);
          padding: 0;
          line-height: 1;
        }
        .star.on {
          color: var(--amber);
        }
        .primary-btn {
          background: var(--amber);
          color: #201603;
          border: none;
          border-radius: var(--radius-sm);
          padding: 10px 18px;
          font-weight: 600;
          font-size: 13px;
          font-family: var(--font-display);
        }
        .primary-btn:disabled {
          opacity: 0.6;
        }
        .msg {
          margin-top: 10px;
          font-size: 12px;
        }
        .msg.error {
          color: var(--coral);
        }
        .msg.ok {
          color: var(--mint);
        }
      `}</style>
    </CollapsibleCard>
  );
}
