"use client";

import { useState } from "react";
import { supabase, Profile } from "@/lib/supabaseClient";
import { callAdminApi } from "@/lib/auth";
import { FEATURE_DEFS, FeatureKey, ROLE_LABELS, UserRole, hasFeature } from "@/lib/config";

type Props = {
  profile: Profile;
  currentUserId: string;
  onChanged: () => void;
  onClose: () => void;
};

export default function AdminUserEditor({ profile, currentUserId, onChanged, onClose }: Props) {
  const [role, setRole] = useState<UserRole>(profile.role);
  const [isActive, setIsActive] = useState(profile.is_active);
  const [features, setFeatures] = useState<Partial<Record<FeatureKey, boolean>>>(profile.features || {});
  const [dailyBudget, setDailyBudget] = useState(profile.daily_budget?.toString() ?? "");
  const [monthlyBudget, setMonthlyBudget] = useState(profile.monthly_budget?.toString() ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "ok" | "error"; msg?: string }>({
    kind: "idle",
  });

  const isSelf = profile.id === currentUserId;

  async function saveProfile() {
    setStatus({ kind: "busy" });
    const { error } = await supabase
      .from("profiles")
      .update({
        role,
        is_active: isActive,
        features,
        daily_budget: dailyBudget ? Number(dailyBudget) : null,
        monthly_budget: monthlyBudget ? Number(monthlyBudget) : null,
      })
      .eq("id", profile.id);

    if (error) {
      setStatus({ kind: "error", msg: error.message });
      return;
    }
    setStatus({ kind: "ok", msg: "Saved." });
    onChanged();
  }

  async function resetPassword() {
    if (newPassword.length < 8) {
      setStatus({ kind: "error", msg: "New password must be at least 8 characters." });
      return;
    }
    setStatus({ kind: "busy" });
    const { ok, data } = await callAdminApi(`/api/admin/users/${profile.id}`, {
      method: "PATCH",
      body: JSON.stringify({ password: newPassword }),
    });
    if (!ok) {
      setStatus({ kind: "error", msg: data.error ?? "Could not reset password." });
      return;
    }
    setNewPassword("");
    setStatus({ kind: "ok", msg: "Password updated." });
  }

  async function deleteUser() {
    if (isSelf) return;
    if (!confirm(`Delete ${profile.email}? This removes their account and all their expense data permanently.`)) {
      return;
    }
    setStatus({ kind: "busy" });
    const { ok, data } = await callAdminApi(`/api/admin/users/${profile.id}`, { method: "DELETE" });
    if (!ok) {
      setStatus({ kind: "error", msg: data.error ?? "Could not delete user." });
      return;
    }
    onChanged();
    onClose();
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="head">
          <div>
            <span className="eyebrow">Manage account</span>
            <h2>{profile.full_name || profile.email}</h2>
            <p className="sub">{profile.email}</p>
          </div>
          <button className="close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="section">
          <span className="label">Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} disabled={isSelf}>
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          {isSelf && <p className="hint">You can't change your own role here.</p>}
        </div>

        <div className="section">
          <label className="toggle-row">
            <span className="label">Account active</span>
            <input
              type="checkbox"
              checked={isActive}
              disabled={isSelf}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </label>
          <p className="hint">Deactivating blocks sign-in without deleting their data.</p>
        </div>

        <div className="section">
          <span className="label">Daily budget cap (₦)</span>
          <input
            className="tab-nums"
            inputMode="decimal"
            value={dailyBudget}
            onChange={(e) => setDailyBudget(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="No cap"
          />
        </div>
        <div className="section">
          <span className="label">Monthly budget cap (₦)</span>
          <input
            className="tab-nums"
            inputMode="decimal"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="No cap"
          />
        </div>

        <div className="section">
          <span className="label">Features visible to this user</span>
          <div className="feature-list">
            {FEATURE_DEFS.map((f) => (
              <label className="feature-row" key={f.key}>
                <input
                  type="checkbox"
                  checked={hasFeature(features, f.key)}
                  onChange={(e) => setFeatures({ ...features, [f.key]: e.target.checked })}
                />
                <span>
                  <strong>{f.label}</strong>
                  <span className="feature-desc">{f.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <button className="primary-btn" onClick={saveProfile} disabled={status.kind === "busy"}>
          Save changes
        </button>

        <div className="divider" />

        <div className="section">
          <span className="label">Reset password</span>
          <div className="row">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
            />
            <button className="secondary-btn" onClick={resetPassword} disabled={status.kind === "busy"}>
              Set password
            </button>
          </div>
        </div>

        {!isSelf && (
          <>
            <div className="divider" />
            <button className="danger-btn" onClick={deleteUser} disabled={status.kind === "busy"}>
              Delete this account
            </button>
          </>
        )}

        {status.msg && <p className={`msg ${status.kind}`}>{status.msg}</p>}
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 13, 22, 0.6);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 40px 20px;
          overflow-y: auto;
          z-index: 50;
        }
        .panel {
          width: 100%;
          max-width: 460px;
          background: linear-gradient(180deg, var(--ink-2), var(--ink));
          border: 1px solid var(--line-strong);
          border-radius: var(--radius);
          padding: 28px;
          box-shadow: var(--shadow);
        }
        .head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .eyebrow {
          font-family: var(--font-display);
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--amber);
        }
        h2 {
          font-family: var(--font-display);
          font-size: 20px;
          margin-top: 4px;
        }
        .sub {
          color: var(--text-faint);
          font-size: 12px;
          margin-top: 2px;
        }
        .close {
          background: transparent;
          border: none;
          color: var(--text-faint);
          font-size: 16px;
          padding: 4px;
        }
        .section {
          margin-bottom: 18px;
        }
        .label {
          display: block;
          font-size: 12px;
          color: var(--text-dim);
          font-weight: 500;
          margin-bottom: 7px;
        }
        select,
        input {
          background: var(--ink);
          border: 1px solid var(--line-strong);
          border-radius: var(--radius-sm);
          color: var(--text);
          padding: 11px 13px;
          font-size: 14px;
          width: 100%;
        }
        input:focus,
        select:focus {
          outline: none;
          border-color: var(--amber);
          box-shadow: 0 0 0 3px rgba(232, 163, 61, 0.18);
        }
        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .toggle-row input {
          width: auto;
        }
        .hint {
          color: var(--text-faint);
          font-size: 11px;
          margin-top: 6px;
        }
        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .feature-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
        }
        .feature-row input {
          width: auto;
          margin-top: 3px;
        }
        .feature-row span {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .feature-row strong {
          color: var(--text);
        }
        .feature-desc {
          color: var(--text-faint);
          font-size: 11px;
        }
        .primary-btn {
          width: 100%;
          background: var(--amber);
          color: #201603;
          border: none;
          border-radius: var(--radius-sm);
          padding: 12px 20px;
          font-weight: 600;
          font-size: 14px;
          font-family: var(--font-display);
        }
        .secondary-btn {
          background: transparent;
          border: 1px solid var(--amber);
          color: var(--text);
          border-radius: var(--radius-sm);
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
        }
        .danger-btn {
          width: 100%;
          background: transparent;
          border: 1px solid var(--coral);
          color: var(--coral);
          border-radius: var(--radius-sm);
          padding: 12px 20px;
          font-weight: 600;
          font-size: 14px;
        }
        .row {
          display: flex;
          gap: 10px;
        }
        .divider {
          height: 1px;
          background: var(--line);
          margin: 20px 0;
        }
        .msg {
          margin-top: 14px;
          font-size: 13px;
        }
        .msg.error {
          color: var(--coral);
        }
        .msg.ok {
          color: var(--mint);
        }
      `}</style>
    </div>
  );
}
