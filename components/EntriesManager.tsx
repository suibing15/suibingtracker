"use client";

import { useState } from "react";
import { Expense, supabase } from "@/lib/supabaseClient";
import { categoryByKey, formatMoney, formatDate } from "@/lib/config";

type Props = {
  expenses: Expense[];
  onChanged: () => void;
  bare?: boolean; // when nested inside another CollapsibleCard, skip our own toggle
};

export default function EntriesManager({ expenses, onChanged, bare = false }: Props) {
  const [open, setOpen] = useState(false);
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  async function remove(id: string) {
    if (!confirm("Delete this expense? This cannot be undone.")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      alert("Could not delete: " + error.message);
      return;
    }
    onChanged();
  }

  const body = (
    <div className="body">
      {expenses.length === 0 ? (
        <p className="empty">Nothing in this range yet.</p>
      ) : (
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th>Paid with</th>
                <th className="right">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => {
                    const cat = categoryByKey(e.category);
                    return (
                      <tr key={e.id}>
                        <td className="tab-nums dim">{formatDate(e.spent_on)}</td>
                        <td>
                          <div className="title">{e.title}</div>
                          {e.note && <div className="note">{e.note}</div>}
                        </td>
                        <td>
                          <span className="chip" style={{ borderColor: cat.color }}>
                            <span className="dot" style={{ background: cat.color }} />
                            {cat.label}
                          </span>
                        </td>
                        <td className="dim">{e.payment_method}</td>
                        <td className="right tab-nums amount">{formatMoney(e.amount)}</td>
                        <td className="right">
                          <button className="del" onClick={() => remove(e.id)} aria-label="Delete">✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="dim">Total ({expenses.length})</td>
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
          <span className="label">Manage individual entries</span>
          <span className="count">({expenses.length} in this range)</span>
        </span>
        <span className="hint">{open ? "Hide" : "Show"}</span>
      </button>

      {open && body}

      <style jsx>{entriesStyles}</style>
    </div>
  );
}

const entriesStyles = `
        .entries-card {
          background: linear-gradient(180deg, var(--ink-2), var(--ink));
          border: 1px solid var(--line-strong);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .disclosure {
          width: 100%;
          background: transparent;
          border: none;
          color: var(--text);
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .chevron {
          display: inline-block;
          transition: transform 0.15s ease;
          color: var(--amber);
          font-size: 18px;
        }
        .chevron.open {
          transform: rotate(90deg);
        }
        .label {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 14px;
        }
        .count {
          color: var(--text-faint);
          font-size: 12px;
        }
        .hint {
          color: var(--text-dim);
          font-size: 12px;
        }
        .body {
          padding: 0 22px 22px;
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
          padding: 0 12px 12px;
          border-bottom: 1px solid var(--line-strong);
        }
        td {
          padding: 12px;
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
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid;
          border-radius: 999px;
          padding: 4px 11px;
          font-size: 12px;
          color: var(--text);
          white-space: nowrap;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .amount {
          color: var(--text);
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
          padding-top: 16px;
          font-weight: 600;
        }
        .total {
          color: var(--amber);
          font-family: var(--font-display);
          font-size: 15px;
        }
        .empty {
          color: var(--text-faint);
          font-size: 13px;
          padding: 6px 0 0;
        }
`;
