"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, SavingsContribution } from "@/lib/supabaseClient";
import { formatMoney, formatDate } from "@/lib/config";

type Props = { bare?: boolean };

export default function SavingsHistoryManager({ bare = false }: Props) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<SavingsContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const load = async () => {
    if (!hasLoadedOnce.current) setLoading(true);
    const { data } = await supabase
      .from("savings_contributions")
      .select("*")
      .order("contributed_on", { ascending: false })
      .order("created_at", { ascending: false });
    setRows((data as SavingsContribution[]) ?? []);
    setLoading(false);
    hasLoadedOnce.current = true;
  };

  useEffect(() => {
    load();
  }, []);

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);

  const body = (
    <div className="body">
      {loading ? (
        <p className="empty">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="empty">No savings contributions logged yet.</p>
      ) : (
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Goal</th>
                <th className="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="tab-nums dim">{formatDate(r.contributed_on)}</td>
                  <td>
                    {r.goal_name}
                    {!r.goal_id && <span className="deleted-tag"> (goal deleted)</span>}
                  </td>
                  <td className="right tab-nums amount">{formatMoney(r.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="dim">Total ({rows.length})</td>
                <td className="right tab-nums total">{formatMoney(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );

  if (bare) {
    return (
      <>
        {body}
        <style jsx>{historyStyles}</style>
      </>
    );
  }

  return (
    <div className="history-card">
      <button className="disclosure" onClick={() => setOpen((v) => !v)}>
        <span className="left">
          <span className={`chevron ${open ? "open" : ""}`}>›</span>
          <span className="label">Savings goal history</span>
          <span className="count">({rows.length} contributions, all time)</span>
        </span>
        <span className="hint">{open ? "Hide" : "Show"}</span>
      </button>
      {open && body}
      <style jsx>{historyStyles}</style>
    </div>
  );
}

const historyStyles = `
  .history-card {
    background: var(--ink);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }
  .disclosure {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--text);
    padding: 14px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .left {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 10px;
  }
  .chevron {
    display: inline-block;
    transition: transform 0.15s ease;
    color: var(--amber);
    font-size: 16px;
  }
  .chevron.open {
    transform: rotate(90deg);
  }
  .label {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 13px;
  }
  .count {
    color: var(--text-faint);
    font-size: 12px;
  }
  .hint {
    color: var(--text-dim);
    font-size: 12px;
    flex-shrink: 0;
  }
  .body {
    padding: 0 18px 18px;
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
  }
  td {
    padding: 10px;
    border-bottom: 1px solid var(--line);
    vertical-align: top;
    color: var(--text);
  }
  .right {
    text-align: right;
  }
  .dim {
    color: var(--text-dim);
  }
  .deleted-tag {
    color: var(--text-faint);
    font-size: 11px;
  }
  .amount {
    color: var(--mint);
    font-weight: 500;
  }
  tfoot td {
    border-bottom: none;
    padding-top: 14px;
    font-weight: 600;
  }
  .total {
    color: var(--amber);
    font-family: var(--font-display);
    font-size: 14px;
  }
  .empty {
    color: var(--text-faint);
    font-size: 13px;
    padding: 6px 0 0;
  }
`;
