"use client";

import { useMemo } from "react";
import { Expense, IncomeEntry } from "@/lib/supabaseClient";
import { formatMoney } from "@/lib/config";

type Props = { expenses: Expense[]; income: IncomeEntry[]; bare?: boolean };

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

  if (stats.incomeSoFar === 0) {
    return (
      <div className={`projector-card ${bare ? "bare" : ""}`}>
        {!bare && (
          <>
            <span className="eyebrow">Looking ahead</span>
            <h2>Income projection</h2>
          </>
        )}
        <p className="empty">Log some income this month to see a projected month-end savings estimate here.</p>
        <style jsx>{cardStyles}</style>
      </div>
    );
  }

  const netPositive = stats.projectedNet >= 0;

  return (
    <div className={`projector-card ${bare ? "bare" : ""}`}>
      {!bare && (
        <>
          <span className="eyebrow">Looking ahead</span>
          <h2>Income projection</h2>
        </>
      )}

      <div className="grid">
        <div className="stat">
          <span className="label">Projected income</span>
          <span className="value mint tab-nums">{formatMoney(stats.projectedIncome)}</span>
        </div>
        <div className="stat">
          <span className="label">Projected spend</span>
          <span className="value amber tab-nums">{formatMoney(stats.projectedSpend)}</span>
        </div>
        <div className="stat">
          <span className="label">Projected net savings</span>
          <span className={`value tab-nums ${netPositive ? "mint" : "coral"}`}>
            {netPositive ? "+" : ""}
            {formatMoney(stats.projectedNet)}
          </span>
        </div>
      </div>

      <p className="explain">
        Based on {formatMoney(stats.incomeSoFar)} logged so far this month (day {stats.daysElapsed} of{" "}
        {stats.daysInMonth}). A simple estimate from current pace on both sides — it'll adjust as you log more
        income and expenses.
      </p>

      <style jsx>{cardStyles}</style>
    </div>
  );
}

const cardStyles = `
  .projector-card {
    background: linear-gradient(180deg, var(--ink-2), var(--ink));
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    padding: 26px;
    box-shadow: var(--shadow);
  }
  .projector-card.bare {
    background: none;
    border: none;
    box-shadow: none;
    padding: 0;
  }
  .eyebrow {
    font-family: var(--font-display);
    font-size: 11px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--amber);
  }
  h2 {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 20px;
    margin-top: 6px;
    margin-bottom: 18px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  .stat {
    background: var(--ink);
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .label {
    font-size: 11px;
    color: var(--text-faint);
  }
  .value {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 16px;
  }
  .value.mint {
    color: var(--mint);
  }
  .value.amber {
    color: var(--amber);
  }
  .value.coral {
    color: var(--coral);
  }
  .explain {
    color: var(--text-dim);
    font-size: 13px;
    line-height: 1.6;
  }
  .empty {
    color: var(--text-faint);
    font-size: 13px;
  }
  @media (max-width: 560px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
`;
