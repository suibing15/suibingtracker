"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/config";

const today = () => new Date().toISOString().slice(0, 10);

type Props = { onSaved: () => void };

export default function ExpenseForm({ onSaved }: Props) {
  const [spentOn, setSpentOn] = useState(today());
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<
    { kind: "idle" | "saving" | "ok" | "error"; msg?: string }
  >({ kind: "idle" });

  async function handleSave() {
    if (!title.trim()) {
      setStatus({ kind: "error", msg: "Add a short title so you know what this was." });
      return;
    }
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setStatus({ kind: "error", msg: "Enter an amount greater than zero." });
      return;
    }

    setStatus({ kind: "saving" });
    const { error } = await supabase.from("expenses").insert({
      spent_on: spentOn,
      title: title.trim(),
      category,
      payment_method: method,
      amount: numAmount,
      note: note.trim() || null,
    });

    if (error) {
      setStatus({ kind: "error", msg: error.message });
      return;
    }

    setStatus({ kind: "ok", msg: "Saved." });
    setTitle("");
    setAmount("");
    setNote("");
    onSaved();
    setTimeout(() => setStatus({ kind: "idle" }), 2000);
  }

  return (
    <div className="form-card">
      <div className="form-head">
        <span className="eyebrow">Log a spend</span>
        <h2>What did you spend on?</h2>
      </div>

      <div className="grid">
        <label className="field span-2">
          <span>Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lunch at the canteen"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </label>

        <label className="field">
          <span>Amount (₦)</span>
          <input
            className="tab-nums"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.00"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </label>

        <label className="field">
          <span>Date</span>
          <input
            type="date"
            value={spentOn}
            max={today()}
            onChange={(e) => setSpentOn(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Paid with</span>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="field span-2">
          <span>Note (optional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything worth remembering"
          />
        </label>
      </div>

      <div className="form-foot">
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={status.kind === "saving"}
        >
          {status.kind === "saving" ? "Saving…" : "Add expense"}
        </button>
        {status.msg && (
          <span
            className={`status ${status.kind === "error" ? "err" : "ok"}`}
          >
            {status.msg}
          </span>
        )}
      </div>

      <style jsx>{`
        .form-card {
          background: linear-gradient(180deg, var(--ink-2), var(--ink));
          border: 1px solid var(--line-strong);
          border-radius: var(--radius);
          padding: 28px;
          box-shadow: var(--shadow);
        }
        .form-head {
          margin-bottom: 22px;
        }
        .eyebrow {
          font-family: var(--font-display);
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--amber);
        }
        .form-head h2 {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 22px;
          margin-top: 6px;
          color: var(--text);
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .span-2 {
          grid-column: span 2;
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
          padding: 12px 14px;
          font-size: 15px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        input::placeholder {
          color: var(--text-faint);
        }
        input:focus,
        select:focus {
          outline: none;
          border-color: var(--amber);
          box-shadow: 0 0 0 3px rgba(232, 163, 61, 0.18);
        }
        .form-foot {
          margin-top: 22px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .save-btn {
          background: var(--amber);
          color: #201603;
          border: none;
          border-radius: var(--radius-sm);
          padding: 13px 26px;
          font-weight: 600;
          font-size: 15px;
          font-family: var(--font-display);
          transition: transform 0.1s, background 0.15s;
        }
        .save-btn:hover:not(:disabled) {
          background: var(--amber-soft);
          transform: translateY(-1px);
        }
        .save-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .status {
          font-size: 13px;
          font-weight: 500;
        }
        .status.ok {
          color: var(--mint);
        }
        .status.err {
          color: var(--coral);
        }
        @media (max-width: 560px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .span-2 {
            grid-column: span 1;
          }
          .form-card {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
