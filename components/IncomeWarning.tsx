"use client";

import { useMemo, useState } from "react";
import { supabase, Expense, Profile } from "@/lib/supabaseClient";
import { formatMoney } from "@/lib/config";
import CollapsibleCard from "./CollapsibleCard";

type Props = { profile: Profile; expenses: Expense[]; onSaved: () => void; bare?: boolean };

export default function IncomeWarning({ profile, expenses, onSaved, bare = false }: Props) {
  const [editing, setEditing] = useState(profile.monthly_income == null);
  const [value, setValue] = useState(profile.monthly_income?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const spendThisMonth = useMemo(() => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    return expenses.filter((e) => e.spent_on >= monthStart).reduce((s, e) => s + Number(e.amount), 0);
  }, [expenses]);

  const income = profile.monthly_income;
  const ratio = income && income > 0 ? spendThisMonth / income : null;

  async function save() {
    const num = value ? parseFloat(value) : null;
    if (value && (!num || num <= 0)) {
      setErr("Enter an amount greater than zero, or clear it to remove your income.");
      return;
    }
    setSaving(true);
    setErr(null);
    const { error } = await supabase.from("profiles").update({ monthly_income: num }).eq("id", profile.id);
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setEditing(false);
    onSaved();
  }

  let tone: "calm" | "watch" | "over" = "calm";
  if (ratio != null) {
    if (ratio >= 1) tone = "over";
    else if (ratio >= 0.8) tone = "watch";
  }
  // Inline, not class-based: guarantees the right color renders regardless
  // of any CSS-scoping/cascade edge case with dynamically-built class names.
  const toneColor = tone === "over" ? "var(--coral)" : tone === "watch" ? "var(--amber)" : "var(--mint)";
  const toneTextColor = tone === "over" ? "var(--coral)" : tone === "watch" ? "var(--amber-soft)" : "var(--mint)";

  const body = (
    <div className="income-body" style={{ borderColor: income != null ? toneColor : undefined }}>
      {!editing && income != null && (
        <button className="edit-link" onClick={() => setEditing(true)}>Edit your income</button>
      )}

      {editing ? (
        <div className="edit-row">
          <input
            className="tab-nums"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="Your monthly income (₦)"
          />
          <button className="save-btn" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      ) : income == null ? (
        <p className="empty">Set your monthly income to see how your spend compares — nothing is shared with anyone.</p>
      ) : (
        <>
          <p className="line">
            You've spent <strong className="tab-nums">{formatMoney(spendThisMonth)}</strong> of your{" "}
            <strong className="tab-nums">{formatMoney(income)}</strong> monthly income so far —{" "}
            <strong style={{ color: toneTextColor }}>{Math.round((ratio ?? 0) * 100)}%</strong>.
          </p>
          <div className="track">
            <div
              className="fill"
              style={{ width: `${Math.min(100, (ratio ?? 0) * 100)}%`, backgroundColor: toneColor }}
            />
          </div>
          <p className="tone-line" style={{ color: toneTextColor }}>
            {tone === "calm" && "You're comfortably within your income this month."}
            {tone === "watch" && "You're getting close to your income for the month — worth easing off non-essentials."}
            {tone === "over" && "You've spent your whole month's income already. Everything from here is a shortfall — worth a closer look."}
          </p>
        </>
      )}
      {err && <p className="err">{err}</p>}
    </div>
  );

  if (bare) {
    return (
      <>
        {body}
        <style jsx>{incomeStyles}</style>
      </>
    );
  }

  return (
    <CollapsibleCard eyebrow="Keep it in perspective" title="Income vs spend">
      {body}
      <style jsx>{incomeStyles}</style>
    </CollapsibleCard>
  );
}

const incomeStyles = `
  .income-body {
    background: var(--ink);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    padding: 16px 18px;
  }
  .edit-link {
    background: transparent;
    border: none;
    color: var(--text-dim);
    font-size: 12px;
    padding: 0;
    margin-bottom: 10px;
    display: inline-block;
  }
  .edit-link:hover {
    color: var(--amber);
  }
  .edit-row {
    display: flex;
    gap: 10px;
  }
  input {
    flex: 1;
    background: var(--ink);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    color: var(--text);
    padding: 11px 13px;
    font-size: 14px;
  }
  input:focus {
    outline: none;
    border-color: var(--amber);
  }
  .save-btn {
    background: var(--amber);
    color: #201603;
    border: none;
    border-radius: var(--radius-sm);
    padding: 11px 20px;
    font-weight: 600;
    font-size: 13px;
  }
  .empty {
    color: var(--text-faint);
    font-size: 13px;
    line-height: 1.6;
  }
  .line {
    font-size: 14px;
    color: var(--text-dim);
    line-height: 1.6;
  }
  .line strong {
    color: var(--text);
    font-weight: 600;
  }
  .track {
    margin-top: 12px;
    height: 8px;
    background: var(--ink-3);
    border-radius: 6px;
    overflow: hidden;
  }
  .fill {
    height: 100%;
    border-radius: 6px;
    transition: width 0.4s ease;
  }
  .tone-line {
    margin-top: 10px;
    font-size: 13px;
  }
  .err {
    color: var(--coral);
    font-size: 12px;
    margin-top: 10px;
  }
`;
