"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, AdminOverviewRow } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS, hasFeature, formatMoney } from "@/lib/config";
import ThemeToggle from "@/components/ThemeToggle";

export default function UsersOverviewPage() {
  const router = useRouter();
  const { loading, session, profile } = useAuth();
  const [rows, setRows] = useState<AdminOverviewRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const canView =
    profile?.role === "super_admin" ||
    (profile?.role === "admin" && hasFeature(profile.features, "users_overview"));

  const loadRows = useCallback(async () => {
    setRowsLoading(true);
    const { data, error } = await supabase.rpc("admin_user_overview");
    if (error) setErr(error.message);
    else setRows((data as AdminOverviewRow[]) ?? []);
    setRowsLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (profile && !canView) {
      router.replace("/");
      return;
    }
    if (canView) loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session, profile, canView, router]);

  if (loading || (profile && !canView)) {
    return (
      <main className="wrap">
        <p className="loading">Checking access…</p>
        <style jsx>{pageStyles}</style>
      </main>
    );
  }

  const totals = rows.reduce(
    (acc, r) => {
      acc.users += 1;
      if (r.is_active) acc.active += 1;
      acc.spendToday += Number(r.spend_today);
      acc.spendMonth += Number(r.spend_this_month);
      return acc;
    },
    { users: 0, active: 0, spendToday: 0, spendMonth: 0 }
  );

  return (
    <main className="wrap">
      <header className="topbar">
        <div>
          <span className="eyebrow">Read-only oversight</span>
          <h1>Users dashboard</h1>
          <p className="sub">
            Aggregate spend totals only — no titles, categories, or individual entries are ever shown here.
          </p>
        </div>
        <div className="actions">
          <ThemeToggle />
          {profile?.role === "super_admin" && (
            <Link href="/admin" className="link-btn">Manage users →</Link>
          )}
          <Link href="/" className="link-btn">← Back to tracker</Link>
        </div>
      </header>

      <div className="summary-grid">
        <div className="summary-card">
          <span className="label">Total users</span>
          <span className="value tab-nums">{totals.users}</span>
        </div>
        <div className="summary-card">
          <span className="label">Active</span>
          <span className="value tab-nums">{totals.active}</span>
        </div>
        <div className="summary-card">
          <span className="label">Spent today (all users)</span>
          <span className="value tab-nums">{formatMoney(totals.spendToday)}</span>
        </div>
        <div className="summary-card">
          <span className="label">Spent this month (all users)</span>
          <span className="value tab-nums">{formatMoney(totals.spendMonth)}</span>
        </div>
      </div>

      {err && <div className="notice err">Error: {err}</div>}

      <div className="table-card">
        {rowsLoading ? (
          <p className="loading">Loading…</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th className="right">Today</th>
                <th className="right">This month</th>
                <th className="right">Entries (month)</th>
                <th>Last activity</th>
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
                  <td className="right tab-nums">{formatMoney(r.spend_today)}</td>
                  <td className="right tab-nums">{formatMoney(r.spend_this_month)}</td>
                  <td className="right tab-nums dim">{r.entries_this_month}</td>
                  <td className="dim">
                    {r.last_entry_at
                      ? new Date(r.last_entry_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
    align-items: flex-start;
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
    max-width: 480px;
    line-height: 1.5;
  }
  .actions {
    display: flex;
    gap: 14px;
    align-items: center;
    flex-wrap: wrap;
  }
  .link-btn {
    color: var(--text-dim);
    font-size: 13px;
    text-decoration: none;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    padding: 8px 14px;
  }
  .link-btn:hover {
    color: var(--text);
    border-color: var(--amber);
  }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 20px;
  }
  .summary-card {
    background: linear-gradient(180deg, var(--ink-2), var(--ink));
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    padding: 20px;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .summary-card .label {
    font-size: 12px;
    color: var(--text-faint);
  }
  .summary-card .value {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    color: var(--amber);
  }
  .table-card {
    background: linear-gradient(180deg, var(--ink-2), var(--ink));
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    padding: 26px;
    box-shadow: var(--shadow);
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
    padding: 0 12px 12px;
    border-bottom: 1px solid var(--line-strong);
    white-space: nowrap;
  }
  td {
    padding: 13px 12px;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
  }
  .right {
    text-align: right;
  }
  .dim {
    color: var(--text-dim);
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
  .loading {
    color: var(--text-faint);
    padding: 20px 0;
  }
  .notice.err {
    background: rgba(240, 106, 106, 0.1);
    border: 1px solid rgba(240, 106, 106, 0.4);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
    font-size: 13px;
    color: var(--text);
    margin-bottom: 16px;
  }
  @media (max-width: 720px) {
    .summary-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
`;
