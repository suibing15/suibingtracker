"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, RecurringBill } from "@/lib/supabaseClient";
import { CATEGORIES, PAYMENT_METHODS, BILL_FREQUENCY_LABELS, nextDueDate, formatMoney, formatDate } from "@/lib/config";

const today = () => new Date().toISOString().slice(0, 10);

type Props = { userId: string; onLogged: () => void };

export default function RecurringBillsManager({ userId, onLogged }: Props) {
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [dueDate, setDueDate] = useState(today());
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "ok" | "error"; msg?: string }>({ kind: "idle" });

  function flash(kind: "ok" | "error", msg: string) {
    setStatus({ kind, msg });
    setTimeout(() => setStatus({ kind: "idle" }), 2500);
  }

  const load = async () => {
    if (!hasLoadedOnce.current) setLoading(true);
    const { data } = await supabase
      .from("recurring_bills")
      .select("*")
      .eq("is_active", true)
      .order("next_due_date", { ascending: true });
    setBills((data as RecurringBill[]) ?? []);
    setLoading(false);
    hasLoadedOnce.current = true;
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setTitle("");
    setAmount("");
    setCategory(CATEGORIES[0].key);
    setMethod(PAYMENT_METHODS[0]);
    setFrequency("monthly");
    setDueDate(today());
    setEditingId(null);
    setShowAdd(false);
  }

  function startEdit(bill: RecurringBill) {
    setEditingId(bill.id);
    setTitle(bill.title);
    setAmount(String(bill.amount));
    setCategory(bill.category);
    setMethod(bill.payment_method);
    setFrequency(bill.frequency);
    setDueDate(bill.next_due_date);
    setShowAdd(true);
  }

  async function saveBill() {
    if (!title.trim()) {
      setStatus({ kind: "error", msg: "Give this bill a name." });
      return;
    }
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setStatus({ kind: "error", msg: "Enter an amount greater than zero." });
      return;
    }
    setStatus({ kind: "busy" });
    const payload = {
      title: title.trim(),
      amount: num,
      category,
      payment_method: method,
      frequency,
      next_due_date: dueDate,
    };

    const { error } = editingId
      ? await supabase.from("recurring_bills").update(payload).eq("id", editingId)
      : await supabase.from("recurring_bills").insert({ user_id: userId, ...payload });

    if (error) {
      setStatus({ kind: "error", msg: error.message });
      return;
    }
    const wasEditing = Boolean(editingId);
    resetForm();
    flash("ok", wasEditing ? "Bill updated." : "Bill saved.");
    load();
  }

  async function logAndAdvance(bill: RecurringBill) {
    const { error: insertErr } = await supabase.from("expenses").insert({
      user_id: userId,
      spent_on: today(),
      title: bill.title,
      category: bill.category,
      payment_method: bill.payment_method,
      amount: bill.amount,
      note: "Logged from recurring bill",
    });
    if (insertErr) {
      flash("error", "Could not log: " + insertErr.message);
      return;
    }
    const { error: updateErr } = await supabase
      .from("recurring_bills")
      .update({ next_due_date: nextDueDate(bill.next_due_date, bill.frequency) })
      .eq("id", bill.id);
    if (updateErr) {
      flash("error", "Logged, but could not advance the due date: " + updateErr.message);
    } else {
      flash("ok", `${bill.title} logged as an expense.`);
    }
    load();
    onLogged();
  }

  async function remove(id: string) {
    if (!confirm("Remove this recurring bill? This won't delete any expenses already logged from it.")) return;
    const { error } = await supabase.from("recurring_bills").delete().eq("id", id);
    if (error) {
      flash("error", "Could not remove: " + error.message);
      return;
    }
    if (editingId === id) resetForm();
    flash("ok", "Bill removed.");
    load();
  }

  return (
    <div className="bills">
      <div className="head">
        <h3>Recurring bills</h3>
        <button
          className="add-btn"
          onClick={() => {
            if (showAdd) resetForm();
            else setShowAdd(true);
          }}
        >
          {showAdd ? "Cancel" : "+ Add bill"}
        </button>
      </div>

      {status.msg && <p className={status.kind === "error" ? "err" : "ok"}>{status.msg}</p>}

      {showAdd && (
        <div className="add-form">
          {editingId && <p className="editing-tag">Editing existing bill</p>}
          <div className="grid">
            <label className="field span-2">
              <span>Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Rent, Netflix" />
            </label>
            <label className="field">
              <span>Amount (₦)</span>
              <input
                className="tab-nums"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
              />
            </label>
            <label className="field">
              <span>Frequency</span>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)}>
                {Object.entries(BILL_FREQUENCY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Paid with</span>
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="field span-2">
              <span>Next due date</span>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
          </div>
          <button className="save-btn" onClick={saveBill} disabled={status.kind === "busy"}>
            {status.kind === "busy" ? "Saving…" : editingId ? "Save changes" : "Save bill"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="empty">Loading…</p>
      ) : bills.length === 0 ? (
        <p className="empty">No recurring bills scheduled yet.</p>
      ) : (
        <div className="list">
          {bills.map((b) => {
            const due = b.next_due_date <= today();
            return (
              <div className={`bill-row ${due ? "due" : ""}`} key={b.id}>
                <div className="bill-main">
                  <span className="bill-title">{b.title}</span>
                  <span className="bill-meta">
                    {BILL_FREQUENCY_LABELS[b.frequency]} · Next {formatDate(b.next_due_date)}
                    {due && <span className="due-tag"> · Due</span>}
                  </span>
                </div>
                <span className="bill-amount tab-nums">{formatMoney(b.amount)}</span>
                <div className="bill-actions">
                  <button className="log-btn" onClick={() => logAndAdvance(b)}>Log it</button>
                  <button className="edit-btn" onClick={() => startEdit(b)} aria-label="Edit">✎</button>
                  <button className="del" onClick={() => remove(b.id)} aria-label="Remove">✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .bills {
          margin-top: 4px;
        }
        .head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        h3 {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 600;
        }
        .add-btn {
          background: transparent;
          border: 1px solid var(--amber);
          color: var(--text);
          border-radius: var(--radius-sm);
          padding: 7px 13px;
          font-size: 12px;
          font-weight: 600;
        }
        .add-form {
          background: var(--ink);
          border: 1px solid var(--line-strong);
          border-radius: var(--radius-sm);
          padding: 16px;
          margin-bottom: 16px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }
        .span-2 {
          grid-column: span 2;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .field span {
          font-size: 11px;
          color: var(--text-dim);
        }
        input,
        select {
          background: var(--ink-2);
          border: 1px solid var(--line-strong);
          border-radius: var(--radius-sm);
          color: var(--text);
          padding: 9px 11px;
          font-size: 13px;
          width: 100%;
        }
        input:focus,
        select:focus {
          outline: none;
          border-color: var(--amber);
        }
        .save-btn {
          background: var(--amber);
          color: #201603;
          border: none;
          border-radius: var(--radius-sm);
          padding: 10px 18px;
          font-weight: 600;
          font-size: 13px;
        }
        .err {
          color: var(--coral);
          font-size: 12px;
          margin-top: 8px;
        }
        .ok {
          color: var(--mint);
          font-size: 12px;
          margin-top: 8px;
          margin-bottom: 12px;
        }
        .empty {
          color: var(--text-faint);
          font-size: 13px;
        }
        .list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bill-row {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--ink);
          border: 1px solid var(--line);
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          flex-wrap: wrap;
        }
        .bill-row.due {
          border-color: rgba(232, 163, 61, 0.5);
        }
        .bill-main {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
          min-width: 140px;
        }
        .bill-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }
        .bill-meta {
          font-size: 11px;
          color: var(--text-faint);
        }
        .due-tag {
          color: var(--amber);
          font-weight: 600;
        }
        .bill-amount {
          color: var(--text-dim);
          font-size: 13px;
        }
        .bill-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .log-btn {
          background: transparent;
          border: 1px solid var(--amber);
          color: var(--text);
          border-radius: var(--radius-sm);
          padding: 7px 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .log-btn:hover {
          background: var(--amber);
          color: #201603;
        }
        .edit-btn {
          background: transparent;
          border: 1px solid var(--line-strong);
          color: var(--text-dim);
          border-radius: var(--radius-sm);
          width: 28px;
          height: 28px;
          font-size: 13px;
          flex-shrink: 0;
        }
        .edit-btn:hover {
          border-color: var(--amber);
          color: var(--amber);
        }
        .editing-tag {
          color: var(--amber);
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .del {
          background: transparent;
          border: none;
          color: var(--text-faint);
          font-size: 13px;
          padding: 4px 6px;
        }
        .del:hover {
          color: var(--coral);
        }
        @media (max-width: 480px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .span-2 {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}
