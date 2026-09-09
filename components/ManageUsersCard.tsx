"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, AdminOverviewRow, AdminSpendTotals, Profile } from "@/lib/supabaseClient";
import { callAdminApi } from "@/lib/auth";
import { ROLE_LABELS, ASSIGNABLE_ROLES, UserRole, formatMoney } from "@/lib/config";
import CollapsibleCard from "./CollapsibleCard";
import AdminUserEditor from "./AdminUserEditor";

type Props = { currentUserId: string };

export default function ManageUsersCard({ currentUserId }: Props) {
  const [rows, setRows] = useState<AdminOverviewRow[]>([]);
  const [totals, setTotals] = useState<AdminSpendTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [createStatus, setCreateStatus] = useState<{ kind: "idle" | "busy" | "error"; msg?: string }>({
    kind: "idle",
  });

  const loadRows = useCallback(async () => {
    setLoading(true);
    const [rowsRes, totalsRes] = await Promise.all([
      supabase.rpc("admin_user_overview"),
      supabase.rpc("admin_spend_totals"),
    ]);
    if (rowsRes.error) setErr(rowsRes.error.message);
    else setRows((rowsRes.data as AdminOverviewRow[]) ?? []);

    if (totalsRes.data && totalsRes.data.length > 0) {
      setTotals(totalsRes.data[0] as AdminSpendTotals);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  async function openEditor(id: string) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (error || !data) {
      alert("Could not load that account: " + (error?.message ?? "not found"));
      return;
    }
    setEditing(data as Profile);
  }

  async function createUser() {
    if (!email.trim() || password.length < 8) {
      setCreateStatus({ kind: "error", msg: "Email and a password of at least 8 characters are required." });
      return;
    }
    setCreateStatus({ kind: "busy" });
    const { ok, data } = await callAdminApi("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password, fullName, role }),
    });
    if (!ok) {
      setCreateStatus({ kind: "error", msg: data.error ?? "Could not create user." });
      return;
    }
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("user");
    setShowCreate(false);
    setCreateStatus({ kind: "idle" });
    loadRows();
  }

  return (
    <CollapsibleCard
      eyebrow="Admin"
      title="Manage users"
      subtitle="Individual spend is never shown here — only login activity. Block accounts, grant features, or remove them below."
      badge={`${totals?.total_users ?? rows.length} ${(totals?.total_users ?? rows.length) === 1 ? "user" : "users"}`}
      defaultOpen={false}
    >
      <div className="summary-grid">
        <div className="summary-tile">
          <span className="label">Active</span>
          <span className="value tab-nums">{totals?.active_users ?? 0} / {totals?.total_users ?? 0}</span>
        </div>
        <div className="summary-tile">
          <span className="label">Spent today (everyone)</span>
          <span className="value tab-nums">{formatMoney(totals?.spend_today ?? 0)}</span>
        </div>
        <div className="summary-tile">
          <span className="label">Spent this month (everyone)</span>
          <span className="value tab-nums">{formatMoney(totals?.spend_this_month ?? 0)}</span>
        </div>
      </div>

      <div className="toolbar">
        <button className="primary-btn" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Cancel" : "+ New account"}
        </button>
      </div>

      {showCreate && (
        <div className="create-form">
          <div className="grid">
            <label className="field">
              <span>Full name</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Optional" />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
            </label>
            <label className="field">
              <span>Temporary password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </label>
            <label className="field">
              <span>Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </label>
          </div>
          <button className="primary-btn" onClick={createUser} disabled={createStatus.kind === "busy"}>
            {createStatus.kind === "busy" ? "Creating…" : "Create account"}
          </button>
          {createStatus.msg && <p className="msg error">{createStatus.msg}</p>}
          <p className="hint">
            Share this email/password with them directly — there's no outbound email set up, so they sign in with
            exactly what you set here.
          </p>
        </div>
      )}

      {err && <p className="msg error">{err}</p>}

      {loading ? (
        <p className="loading">Loading accounts…</p>
      ) : (
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th className="right">Logins today</th>
                <th className="right">Logins this month</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="name">{r.full_name || r.email}</div>
                    <div className="email">{r.email}</div>
                  </td>
                  <td><span className="chip">{ROLE_LABELS[r.role]}</span></td>
                  <td>
                    <span className={`status-dot ${r.is_active ? "on" : "off"}`} />
                    {r.is_active ? "Active" : "Blocked"}
                  </td>
                  <td className="right tab-nums">{r.logins_today}</td>
                  <td className="right tab-nums">{r.logins_this_month}</td>
                  <td className="right">
                    <button className="edit-btn" onClick={() => openEditor(r.id)}>Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <AdminUserEditor
          profile={editing}
          currentUserId={currentUserId}
          onClose={() => setEditing(null)}
          onChanged={loadRows}
        />
      )}

      <style jsx>{`
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .summary-tile {
          background: var(--ink);
          border: 1px solid var(--line);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .summary-tile .label {
          font-size: 11px;
          color: var(--text-faint);
        }
        .summary-tile .value {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 16px;
        }
        .toolbar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 14px;
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
        .create-form {
          background: var(--ink);
          border: 1px solid var(--line-strong);
          border-radius: var(--radius-sm);
          padding: 20px;
          margin-bottom: 18px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field span {
          font-size: 12px;
          color: var(--text-dim);
        }
        input,
        select {
          background: var(--ink-2);
          border: 1px solid var(--line-strong);
          border-radius: var(--radius-sm);
          color: var(--text);
          padding: 10px 12px;
          font-size: 13px;
        }
        input:focus,
        select:focus {
          outline: none;
          border-color: var(--amber);
        }
        .hint {
          color: var(--text-faint);
          font-size: 11px;
          margin-top: 12px;
          line-height: 1.5;
        }
        .scroll {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        th {
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-faint);
          font-weight: 600;
          padding: 0 10px 10px;
          border-bottom: 1px solid var(--line-strong);
          white-space: nowrap;
        }
        td {
          padding: 12px 10px;
          border-bottom: 1px solid var(--line);
          white-space: nowrap;
        }
        .right {
          text-align: right;
        }
        .name {
          color: var(--text);
          font-weight: 500;
        }
        .email {
          color: var(--text-faint);
          font-size: 11px;
          margin-top: 2px;
        }
        .chip {
          display: inline-block;
          border: 1px solid var(--line-strong);
          border-radius: 999px;
          padding: 3px 11px;
          font-size: 12px;
        }
        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
        }
        .status-dot.on {
          background: var(--mint);
        }
        .status-dot.off {
          background: var(--coral);
        }
        .edit-btn {
          background: transparent;
          border: 1px solid var(--amber);
          color: var(--text);
          border-radius: var(--radius-sm);
          padding: 6px 13px;
          font-size: 12px;
          font-weight: 600;
        }
        .edit-btn:hover {
          background: var(--amber);
          color: #201603;
        }
        .loading {
          color: var(--text-faint);
          font-size: 13px;
        }
        .msg.error {
          color: var(--coral);
          font-size: 12px;
          margin-bottom: 12px;
        }
        @media (max-width: 640px) {
          .grid,
          .summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </CollapsibleCard>
  );
}
