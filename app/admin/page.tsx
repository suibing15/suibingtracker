"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, Profile } from "@/lib/supabaseClient";
import { callAdminApi, useAuth } from "@/lib/auth";
import { ROLE_LABELS, UserRole } from "@/lib/config";
import AdminUserEditor from "@/components/AdminUserEditor";
import ThemeToggle from "@/components/ThemeToggle";

export default function AdminPage() {
  const router = useRouter();
  const { loading, session, profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [createStatus, setCreateStatus] = useState<{ kind: "idle" | "busy" | "error"; msg?: string }>({
    kind: "idle",
  });

  const loadUsers = useCallback(async () => {
    setListLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });
    if (!error) setUsers((data as Profile[]) ?? []);
    setListLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (profile && profile.role !== "super_admin") {
      router.replace("/");
      return;
    }
    if (profile?.role === "super_admin") loadUsers();
  }, [loading, session, profile, router, loadUsers]);

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
    loadUsers();
  }

  if (loading || (profile && profile.role !== "super_admin")) {
    return (
      <main className="wrap">
        <p className="loading">Checking access…</p>
        <style jsx>{pageStyles}</style>
      </main>
    );
  }

  return (
    <main className="wrap">
      <header className="topbar">
        <div>
          <span className="eyebrow">Admin panel</span>
          <h1>Manage users</h1>
          <p className="sub">Create, block, or remove accounts, and grant features — never their expense details.</p>
        </div>
        <div className="actions">
          <ThemeToggle />
          <Link href="/admin/overview" className="link-btn">Users dashboard →</Link>
          <Link href="/" className="link-btn">← Back to tracker</Link>
          <button className="primary-btn" onClick={() => setShowCreate(true)}>+ New account</button>
        </div>
      </header>

      {showCreate && (
        <div className="create-card">
          <h2>Create an account</h2>
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
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super admin</option>
              </select>
            </label>
          </div>
          <div className="create-actions">
            <button className="primary-btn" onClick={createUser} disabled={createStatus.kind === "busy"}>
              {createStatus.kind === "busy" ? "Creating…" : "Create account"}
            </button>
            <button className="ghost-btn" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
          {createStatus.msg && <p className="msg error">{createStatus.msg}</p>}
          <p className="hint">
            Share this email/password with them directly — there's no outbound email
            configured yet, so they'll sign in with exactly what you set here.
          </p>
        </div>
      )}

      <div className="table-card">
        {listLoading ? (
          <p className="loading">Loading accounts…</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name || <span className="dim">—</span>}</td>
                  <td className="dim">{u.email}</td>
                  <td><span className="chip">{ROLE_LABELS[u.role]}</span></td>
                  <td>
                    <span className={`status-dot ${u.is_active ? "on" : "off"}`} />
                    {u.is_active ? "Active" : "Disabled"}
                  </td>
                  <td className="right">
                    <button className="edit-btn" onClick={() => setEditing(u)}>Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && session && (
        <AdminUserEditor
          profile={editing}
          currentUserId={session.user.id}
          onClose={() => setEditing(null)}
          onChanged={loadUsers}
        />
      )}

      <style jsx>{pageStyles}</style>
    </main>
  );
}

const pageStyles = `
  .wrap {
    max-width: 1080px;
    margin: 0 auto;
    padding: 40px 24px 80px;
  }
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
    flex-wrap: wrap;
    gap: 16px;
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
    font-weight: 700;
    font-size: 26px;
    margin-top: 6px;
  }
  .sub {
    color: var(--text-dim);
    font-size: 13px;
    margin-top: 6px;
    max-width: 440px;
    line-height: 1.5;
  }
  .actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .link-btn {
    color: var(--text-dim);
    font-size: 13px;
    text-decoration: none;
  }
  .link-btn:hover {
    color: var(--text);
  }
  .primary-btn {
    background: var(--amber);
    color: #201603;
    border: none;
    border-radius: var(--radius-sm);
    padding: 11px 20px;
    font-weight: 600;
    font-size: 14px;
    font-family: var(--font-display);
  }
  .ghost-btn {
    background: transparent;
    border: 1px solid var(--line-strong);
    color: var(--text-dim);
    border-radius: var(--radius-sm);
    padding: 11px 18px;
    font-size: 14px;
  }
  .create-card,
  .table-card {
    background: linear-gradient(180deg, var(--ink-2), var(--ink));
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    padding: 26px;
    box-shadow: var(--shadow);
    margin-bottom: 20px;
  }
  .create-card h2 {
    font-family: var(--font-display);
    font-size: 18px;
    margin-bottom: 18px;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .field span {
    font-size: 12px;
    color: var(--text-dim);
    font-weight: 500;
  }
  input,
  select {
    background: var(--ink);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    color: var(--text);
    padding: 11px 13px;
    font-size: 14px;
  }
  input:focus,
  select:focus {
    outline: none;
    border-color: var(--amber);
    box-shadow: 0 0 0 3px rgba(232, 163, 61, 0.18);
  }
  .create-actions {
    display: flex;
    gap: 12px;
    margin-top: 18px;
  }
  .hint {
    color: var(--text-faint);
    font-size: 11px;
    margin-top: 14px;
    line-height: 1.5;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  th {
    text-align: left;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-faint);
    font-weight: 600;
    padding: 0 12px 12px;
    border-bottom: 1px solid var(--line-strong);
  }
  td {
    padding: 13px 12px;
    border-bottom: 1px solid var(--line);
  }
  .dim {
    color: var(--text-dim);
  }
  .right {
    text-align: right;
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
    padding: 7px 14px;
    font-size: 13px;
    font-weight: 600;
  }
  .edit-btn:hover {
    background: var(--amber);
    color: #201603;
  }
  .loading {
    color: var(--text-faint);
    padding: 20px 0;
  }
  .msg.error {
    color: var(--coral);
    font-size: 13px;
    margin-top: 12px;
  }
  @media (max-width: 640px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
`;
