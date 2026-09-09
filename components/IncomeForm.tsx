"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const today = () => new Date().toISOString().slice(0, 10);

type Props = {
  userId: string;
  onSaved: () => void;
  bare?: boolean;
};

export default function IncomeForm({ userId, onSaved, bare = false }: Props) {
  const [receivedOn, setReceivedOn] = useState(today());
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "ok" | "error"; msg?: string }>({
    kind: "idle",
  });

  async function handleSave() {
    if (!source.trim()) {
      setStatus({ kind: "error", msg: "Add a short source so you know where this came from." });
      return;
    }
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setStatus({ kind: "error", msg: "Enter an amount greater than zero." });
      return;
    }

    setStatus({ kind: "saving" });
    const { error } = await supabase.from("income_entries").insert({
      user_id: userId,
      received_on: receivedOn,
      source: source.trim(),
      amount: numAmount,
      note: note.trim() || null,
    });

    if (error) {
      setStatus({ kind: "error", msg: error.message });
      return;
    }

    setStatus({ kind: "ok", msg: "Saved." });
    setSource("");
    setAmount("");
    setNote("");
    onSaved();
    setTimeout(() => setStatus({ kind: "idle" }), 2000);
  }

  return (
    <div className={`income-form ${bare ? "bare" : ""}`}>
      {!bare && (
        <div className="form-head">
          <span className="eyebrow">Log income</span>
          <h2>What came in?</h2>
        </div>
      )}

      <div className="grid">
        <label className="field span-2">
          <span>Source</span>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. Salary, Freelance gig, Gift"
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
          <span>Date received</span>
          <input type="date" value={receivedOn} max={today()} onChange={(e) => setReceivedOn(e.target.value)} />
        </label>

        <label className="field span-2">
          <span>Note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything worth remembering" />
        </label>
      </div>

      <div className="form-foot">
        <button className="save-btn" onClick={handleSave} disabled={status.kind === "saving"}>
          {status.kind === "saving" ? "Saving…" : "Add income"}
        </button>
        {status.msg && <span className={`status ${status.kind === "error" ? "err" : "ok"}`}>{status.msg}</span>}
      </div>

      <style jsx>{`
        .income-form {
          background: linear-gradient(180deg, var(--ink-2), var(--ink));
          border: 1px solid var(--line-strong);
          border-radius: var(--radius);
          padding: 28px;
          box-shadow: var(--shadow);
        }
        .income-form.bare {
          background: none;
          border: none;
          box-shadow: none;
          padding: 0;
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
          min-width: 0;
        }
        .field span {
          font-size: 12px;
          color: var(--text-dim);
          font-weight: 500;
        }
        input {
          background: var(--ink);
          border: 1px solid var(--line-strong);
          border-radius: var(--radius-sm);
          color: var(--text);
          padding: 12px 14px;
          font-size: 15px;
          width: 100%;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        input::placeholder {
          color: var(--text-faint);
        }
        input:focus {
          outline: none;
          border-color: var(--amber);
          box-shadow: 0 0 0 3px rgba(232, 163, 61, 0.18);
        }
        .form-foot {
          margin-top: 22px;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px 16px;
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
          .income-form {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
