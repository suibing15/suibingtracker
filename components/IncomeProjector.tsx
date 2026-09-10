"use client";

import { useMemo } from "react";
import { Expense, IncomeEntry } from "@/lib/supabaseClient";
import { formatMoney } from "@/lib/config";

type Props = { expenses: Expense[]; income: IncomeEntry[]; bare?: boolean };

const cardBox: React.CSSProperties = {
  background: "linear-gradient(180deg, var(--ink-2), var(--ink))",
  border: "1px solid var(--line-strong)",
  borderRadius: "var(--radius)",
  padding: 26,
  boxShadow: "var(--shadow)",
};
const bareBox: React.CSSProperties = { background: "none", border: "none", boxShadow: "none", padding: 0 };
const eyebrowStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 11,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "var(--amber)",
  display: "block",
};
const h2Style: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 600,
  fontSize: 20,
  marginTop: 6,
  marginBottom: 18,
};
const gridStyle: React.CSSProperties = {
  display: "grid",
  // auto-fit + minmax makes this stack to fewer columns as the container
  // narrows, with no media query needed — important since inline styles
  // can't use @media at all (a real gap this fixes vs. the fixed 3-column
  // layout this used to have before the color-bug rewrite).
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 12,
  marginBottom: 16,
};
const statStyle: React.CSSProperties = {
  background: "var(--ink)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-sm)",
  padding: "14px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  minWidth: 0,
};
const labelStyle: React.CSSProperties = { fontSize: 11, color: "var(--text-faint)" };
const valueStyle: React.CSSProperties = { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 };
const explainStyle: React.CSSProperties = { color: "var(--text-dim)", fontSize: 13, lineHeight: 1.6 };
const emptyStyle: React.CSSProperties = { color: "var(--text-faint)", fontSize: 13 };

export default function IncomeProjector({ expenses, income, bare = false }: Props) {
  const stats = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    const incomeSoFar = income
      .filter((i) => i.received_on >= monthStart)
      .reduce((s, i) => s + Number(i.amount), 0);
    const spendSoFar = expenses
      .filter((e) => e.spent_on >= monthStart)
      .reduce((s, e) => s + Number(e.amount), 0);

    const incomeDailyRate = daysElapsed > 0 ? incomeSoFar / daysElapsed : 0;
    const spendDailyRate = daysElapsed > 0 ? spendSoFar / daysElapsed : 0;

    const projectedIncome = incomeDailyRate * daysInMonth;
    const projectedSpend = spendDailyRate * daysInMonth;
    const projectedNet = projectedIncome - projectedSpend;

    return { incomeSoFar, spendSoFar, projectedIncome, projectedSpend, projectedNet, daysElapsed, daysInMonth };
  }, [expenses, income]);

  const boxStyle = { ...cardBox, ...(bare ? bareBox : {}) };

  if (stats.incomeSoFar === 0) {
    return (
      <div style={boxStyle}>
        {!bare && (
          <>
            <span style={eyebrowStyle}>Looking ahead</span>
            <h2 style={h2Style}>Income projection</h2>
          </>
        )}
        <p style={emptyStyle}>Log some income this month to see a projected month-end savings estimate here.</p>
      </div>
    );
  }

  const netPositive = stats.projectedNet >= 0;

  return (
    <div style={boxStyle}>
      {!bare && (
        <>
          <span style={eyebrowStyle}>Looking ahead</span>
          <h2 style={h2Style}>Income projection</h2>
        </>
      )}

      <div style={gridStyle}>
        <div style={statStyle}>
          <span style={labelStyle}>Projected income</span>
          <span className="tab-nums" style={{ ...valueStyle, color: "var(--mint)" }}>
            {formatMoney(stats.projectedIncome)}
          </span>
        </div>
        <div style={statStyle}>
          <span style={labelStyle}>Projected expenses</span>
          <span className="tab-nums" style={{ ...valueStyle, color: "var(--amber)" }}>
            {formatMoney(stats.projectedSpend)}
          </span>
        </div>
        <div style={statStyle}>
          <span style={labelStyle}>Projected net savings</span>
          <span
            className="tab-nums"
            style={{ ...valueStyle, color: netPositive ? "var(--mint)" : "var(--coral)" }}
          >
            {netPositive ? "+" : ""}
            {formatMoney(stats.projectedNet)}
          </span>
        </div>
      </div>

      <p style={explainStyle}>
        Based on {formatMoney(stats.incomeSoFar)} logged so far this month (day {stats.daysElapsed} of{" "}
        {stats.daysInMonth}). A simple estimate from current pace on both sides — it'll adjust as you log more
        income and expenses.
      </p>
    </div>
  );
}
