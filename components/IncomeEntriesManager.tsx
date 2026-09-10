"use client";

import { useState } from "react";
import { IncomeEntry, supabase } from "@/lib/supabaseClient";
import { formatMoney, formatDate } from "@/lib/config";

type Props = {
  entries: IncomeEntry[];
  onChanged: () => void;
  bare?: boolean;
};

export default function IncomeEntriesManager({ entries, onChanged, bare = false }: Props) {
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState<{ kind: "ok" | "error"; msg: string } | null>(null);
  const total = entries.reduce((s, e) => s + Number(e.amount), 0);

  function showFlash(kind: "ok" | "error", msg: string) {
    setFlash({ kind, msg });
    setTimeout(() => setFlash(null), 2500);
  }

  async function remove(id: string) {
    if (!confirm("Delete this income entry? This cannot be undone.")) return;
    const { error } = await supabase.from("income_entries").delete().eq("id", id);
    if (error) {
      showFlash("error", "Could not delete: " + error.message);
      return;
    }
    showFlash("ok", "Entry deleted.");
    onChanged();
  }

  const body = (
    <div className="body">
      {entries.length === 0 ? (
        <p className="empty">No income logged yet.</p>
      ) : (
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th className="right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="tab-nums dim">{formatDate(e.received_on)}</td>
                  <td>
                    <div className="title">{e.source}</div>
                    {e.note && <div className="note">{e.note}</div>}
                  </td>
                  <td className="right tab-nums amount">{formatMoney(e.amount)}</td>
                  <td className="right">
                    <button className="del" onClick={() => remove(e.id)} aria-label="Delete">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="dim">Total ({entries.length})</td>
                <td className="right tab-nums total">{formatMoney(total)}</td>
                <td></td>
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
        {flash && <p className={flash.kind === "error" ? "flash-err" : "flash-ok"}>{flash.msg}</p>}
        {body}
        <style jsx>{entriesStyles}</style>
      </>
    );
  }

  return (
    <div className="entries-card">
      <button className="disclosure" onClick={() => setOpen((v) => !v)}>
        <span className="left">
          <span className={`chevron ${open ? "open" : ""}`}>›</span>
          <span className="label">Manage income entries</span>
          <span className="count">({entries.length} logged)</span>
        </span>
        <span className="hint">{open ? "Hide" : "Show"}</span>
      </button>

      {flash && (
        <p className={`in-card ${flash.kind === "error" ? "flash-err" : "flash-ok"}`}>{flash.msg}</p>
      )}
      {open && body}

      <style jsx>{entriesStyles}</style>
    </div>
  );
}

const entriesStyles = `
  .flash-ok {
    color: var(--mint);
    font-size: 12px;
    padding: 10px 18px 0;
  }
  .flash-err {
    color: var(--coral);
    font-size: 12px;
    padding: 10px 18px 0;
  }
  .in-card {
    padding-left: 18px;
    padding-right: 18px;
  }
  .entries-card {
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
  }
  .right {
    text-align: right;
  }
  .dim {
    color: var(--text-dim);
  }
  .title {
    color: var(--text);
    font-weight: 500;
  }
  .note {
    color: var(--text-faint);
    font-size: 12px;
    margin-top: 3px;
  }
  .amount {
    color: var(--mint);
    font-weight: 500;
  }
  .del {
    background: transparent;
    border: none;
    color: var(--text-faint);
    font-size: 13px;
    padding: 4px 8px;
    border-radius: 6px;
  }
  .del:hover {
    color: var(--coral);
    background: rgba(240, 106, 106, 0.12);
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
