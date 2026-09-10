"use client";

import { useMemo, useState } from "react";
import { supabase, Expense, Profile } from "@/lib/supabaseClient";
import { formatMoney } from "@/lib/config";
import CollapsibleCard from "./CollapsibleCard";

type Props = { profile: Profile; expenses: Expense[]; onSaved: () => void; bare?: boolean };

const boxStyle: React.CSSProperties = {
  background: "var(--ink)",
  border: "1px solid var(--line-strong)",
  borderRadius: "var(--radius-sm)",
  padding: "16px 18px",
};
const editLinkStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--line-strong)",
  color: "var(--text-dim)",
  fontSize: 12,
  padding: "6px 12px",
  marginBottom: 12,
  display: "inline-block",
  borderRadius: "var(--radius-sm)",
};
const editRowStyle: React.CSSProperties = { display: "flex", gap: 10 };
const inputStyle: React.CSSProperties = {
  flex: 1,
  background: "var(--ink-2)",
  border: "1px solid var(--line-strong)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text)",
  padding: "11px 13px",
  fontSize: 14,
};
const saveBtnStyle: React.CSSProperties = {
  background: "var(--amber)",
  color: "#201603",
  border: "none",
  borderRadius: "var(--radius-sm)",
  padding: "11px 20px",
  fontWeight: 600,
  fontSize: 13,
};
const emptyStyle: React.CSSProperties = { color: "var(--text-faint)", fontSize: 13, lineHeight: 1.6 };
const lineStyle: React.CSSProperties = { fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 };
const strongStyle: React.CSSProperties = { color: "var(--text)", fontWeight: 600 };
const trackStyle: React.CSSProperties = {
  marginTop: 12,
  height: 8,
  background: "var(--ink-3)",
  borderRadius: 6,
  overflow: "hidden",
};
const fillBaseStyle: React.CSSProperties = { height: "100%", borderRadius: 6, transition: "width 0.4s ease" };
const toneLineStyle: React.CSSProperties = { marginTop: 10, fontSize: 13 };
const errStyle: React.CSSProperties = { color: "var(--coral)", fontSize: 12, marginTop: 10 };

export default function IncomeWarning({ profile, expenses, onSaved, bare = false }: Props) {
  const [editing, setEditing] = useState(profile.monthly_income == null);
  const [value, setValue] = useState(profile.monthly_income?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

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
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
    onSaved();
  }

  let tone: "calm" | "watch" | "over" = "calm";
  if (ratio != null) {
    if (ratio >= 1) tone = "over";
    else if (ratio >= 0.8) tone = "watch";
  }
  const toneColor = tone === "over" ? "var(--coral)" : tone === "watch" ? "var(--amber)" : "var(--mint)";
  const toneTextColor = tone === "over" ? "var(--coral)" : tone === "watch" ? "var(--amber-soft)" : "var(--mint)";

  const body = (
    <div style={{ ...boxStyle, borderColor: income != null ? toneColor : undefined }}>
      {!editing && income != null && (
        <button style={editLinkStyle} onClick={() => setEditing(true)}>Edit your income</button>
      )}
      {savedFlash && <p style={{ color: "var(--mint)", fontSize: 12, marginBottom: 10 }}>✓ Saved.</p>}

      {editing ? (
        <div style={editRowStyle}>
          <input
            className="tab-nums"
            style={inputStyle}
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="Your monthly income (₦)"
          />
          <button style={{ ...saveBtnStyle, opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      ) : income == null ? (
        <p style={emptyStyle}>Set your monthly income to see how your spend compares — nothing is shared with anyone.</p>
      ) : (
        <>
          <p style={lineStyle}>
            You've spent <strong className="tab-nums" style={strongStyle}>{formatMoney(spendThisMonth)}</strong> of your{" "}
            <strong className="tab-nums" style={strongStyle}>{formatMoney(income)}</strong> monthly income so far —{" "}
            <strong style={{ color: toneTextColor }}>{Math.round((ratio ?? 0) * 100)}%</strong>.
          </p>
          <div style={trackStyle}>
            <div
              style={{ ...fillBaseStyle, width: `${Math.min(100, (ratio ?? 0) * 100)}%`, backgroundColor: toneColor }}
            />
          </div>
          <p style={{ ...toneLineStyle, color: toneTextColor }}>
            {tone === "calm" && "You're comfortably within your income this month."}
            {tone === "watch" && "You're getting close to your income for the month — worth easing off non-essentials."}
            {tone === "over" && "You've spent your whole month's income already. Everything from here is a shortfall — worth a closer look."}
          </p>
        </>
      )}
      {err && <p style={errStyle}>{err}</p>}
    </div>
  );

  if (bare) return body;

  return (
    <CollapsibleCard eyebrow="Keep it in perspective" title="Income vs spend">
      {body}
    </CollapsibleCard>
  );
}
