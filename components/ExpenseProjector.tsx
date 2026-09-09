"use client";

import { useMemo } from "react";
import { Expense, Profile } from "@/lib/supabaseClient";
import { formatMoney } from "@/lib/config";

type Props = { expenses: Expense[]; profile: Profile };

export default function ExpenseProjector({ expenses, profile }: Props) {
  const stats = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const spentSoFar = expenses
      .filter((e) => e.spent_on >= monthStart)
      .reduce((s, e) => s + Number(e.amount), 0);
    const dailyRate = daysElapsed > 0 ? spentSoFar / daysElapsed : 0;
    const projected = dailyRate * daysInMonth;
    const daysLeft = daysInMonth - daysElapsed;
    return { spentSoFar, dailyRate, projected, daysElapsed, daysInMonth, daysLeft };
  }, [expenses]);

  const overCap = profile.monthly_budget != null && stats.projected > profile.monthly_budget;

  if (stats.spentSoFar === 0) {
    return (
      <div className="projector-card">
        <span className="eyebrow">Looking ahead</span>
        <h2>Expense projector</h2>
        <p className="empty">Log a few expenses this month and this will estimate where you'll land by month end.</p>
        <style jsx>{cardStyles}</style>
      </div>
    );
  }

  return (
    <div className="projector-card">
      <span className="eyebrow">Looking ahead</span>
      <h2>Expense projector</h2>
      <div className="headline">
        <span className="figure tab-nums">{formatMoney(stats.projected)}</span>
        <span className="sub">estimated by month end</span>
      </div>
      <p className="explain">
        Based on your average of <strong className="tab-nums">{formatMoney(stats.dailyRate)}</strong> per day so far
        this month (day {stats.daysElapsed} of {stats.daysInMonth}, {stats.daysLeft} to go). This is a simple
        estimate from your current pace, not a guarantee — it'll adjust as you log more.
      </p>
      {overCap && (
        <p className="flag">
          At this pace you're on track to pass your monthly cap of {formatMoney(profile.monthly_budget as number)}.
        </p>
      )}
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
  .headline {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 12px;
  }
  .figure {
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: 700;
    color: var(--amber);
  }
  .sub {
    color: var(--text-dim);
    font-size: 13px;
  }
  .explain {
    color: var(--text-dim);
    font-size: 13px;
    line-height: 1.6;
  }
  .explain strong {
    color: var(--text);
    font-weight: 600;
  }
  .flag {
    margin-top: 12px;
    color: var(--amber-soft);
    font-size: 13px;
    background: rgba(232, 163, 61, 0.1);
    border: 1px solid rgba(232, 163, 61, 0.3);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
  }
  .empty {
    color: var(--text-faint);
    font-size: 13px;
  }
`;
