"use client";

import { useMemo } from "react";
import { Expense } from "@/lib/supabaseClient";
import { categoryByKey, formatMoney } from "@/lib/config";

type Props = { expenses: Expense[]; rangeLabel: string; showCategoryBreakdown?: boolean };

export default function Dashboard({ expenses, rangeLabel, showCategoryBreakdown = true }: Props) {
  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const count = expenses.length;

    // group by day for the pulse
    const byDay = new Map<string, number>();
    for (const e of expenses) {
      byDay.set(e.spent_on, (byDay.get(e.spent_on) ?? 0) + Number(e.amount));
    }
    const days = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const maxDay = Math.max(1, ...days.map((d) => d[1]));
    const activeDays = days.length || 1;
    const avgPerDay = total / activeDays;

    const topDay = days.reduce(
      (m, d) => (d[1] > m[1] ? d : m),
      ["", 0] as [string, number]
    );

    // category breakdown
    const byCat = new Map<string, number>();
    for (const e of expenses) {
      byCat.set(e.category, (byCat.get(e.category) ?? 0) + Number(e.amount));
    }
    const cats = [...byCat.entries()]
      .map(([key, value]) => ({ ...categoryByKey(key), value }))
      .sort((a, b) => b.value - a.value);

    return { total, count, days, maxDay, avgPerDay, topDay, cats };
  }, [expenses]);

  return (
    <div className={`dash ${showCategoryBreakdown ? "" : "single"}`}>
      {/* SIGNATURE: spend pulse */}
      <div className="pulse-card">
        <div className="pulse-top">
          <span className="eyebrow">Total spend · {rangeLabel}</span>
          <div className="total tab-nums">{formatMoney(stats.total)}</div>
          <div className="sub tab-nums">
            {stats.count} {stats.count === 1 ? "entry" : "entries"} ·{" "}
            {formatMoney(stats.avgPerDay)} / active day
          </div>
        </div>

        <div className="pulse-bars" aria-hidden>
          {stats.days.length === 0 ? (
            <div className="pulse-empty">No spending in this range yet.</div>
          ) : (
            stats.days.map(([day, amt]) => (
              <div className="bar-wrap" key={day} title={`${day}: ${formatMoney(amt)}`}>
                <div
                  className="bar"
                  style={{ height: `${Math.max(6, (amt / stats.maxDay) * 100)}%` }}
                />
              </div>
            ))
          )}
        </div>
        <div className="pulse-axis">
          <span>Daily rhythm</span>
          {stats.topDay[0] && (
            <span className="tab-nums">
              Peak {formatMoney(stats.topDay[1])}
            </span>
          )}
        </div>
      </div>

      {/* category breakdown */}
      {showCategoryBreakdown && (
        <div className="break-card">
          <span className="eyebrow">Where it went</span>
          {stats.cats.length === 0 ? (
            <p className="empty">Add an expense to see the breakdown.</p>
          ) : (
            <ul className="cat-list">
              {stats.cats.map((c) => {
                const pct = stats.total ? (c.value / stats.total) * 100 : 0;
                return (
                  <li key={c.key}>
                    <div className="cat-head">
                      <span className="dot" style={{ background: c.color }} />
                      <span className="cat-name">{c.label}</span>
                      <span className="cat-amt tab-nums">{formatMoney(c.value)}</span>
                    </div>
                    <div className="track">
                      <div
                        className="fill"
                        style={{ width: `${pct}%`, background: c.color }}
                      />
                    </div>
                    <span className="cat-pct tab-nums">{pct.toFixed(0)}%</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <style jsx>{`
        .dash {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 18px;
        }
        .dash.single {
          grid-template-columns: 1fr;
        }
        .eyebrow {
          font-family: var(--font-display);
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--amber);
        }
        .pulse-card,
        .break-card {
          background: linear-gradient(180deg, var(--ink-2), var(--ink));
          border: 1px solid var(--line-strong);
          border-radius: var(--radius);
          padding: 26px;
          box-shadow: var(--shadow);
        }
        .total {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 46px;
          line-height: 1.05;
          margin-top: 10px;
          color: var(--text);
          letter-spacing: -0.02em;
        }
        .sub {
          color: var(--text-dim);
          font-size: 14px;
          margin-top: 6px;
        }
        .pulse-bars {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 120px;
          margin-top: 28px;
          padding-top: 8px;
          border-top: 1px solid var(--line);
        }
        .bar-wrap {
          flex: 1;
          height: 100%;
          display: flex;
          align-items: flex-end;
          min-width: 3px;
        }
        .bar {
          width: 100%;
          background: linear-gradient(180deg, var(--amber), rgba(232, 163, 61, 0.35));
          border-radius: 4px 4px 2px 2px;
          transition: height 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .pulse-empty {
          color: var(--text-faint);
          font-size: 14px;
          align-self: center;
          margin: auto;
        }
        .pulse-axis {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          font-size: 12px;
          color: var(--text-faint);
        }
        .cat-list {
          list-style: none;
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .cat-head {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 14px;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .cat-name {
          color: var(--text);
          font-weight: 500;
        }
        .cat-amt {
          margin-left: auto;
          color: var(--text-dim);
        }
        .track {
          height: 7px;
          background: var(--ink-3);
          border-radius: 6px;
          margin-top: 8px;
          overflow: hidden;
        }
        .fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .cat-pct {
          font-size: 11px;
          color: var(--text-faint);
          margin-top: 3px;
          display: inline-block;
        }
        .empty {
          color: var(--text-faint);
          font-size: 14px;
          margin-top: 18px;
        }
        @media (max-width: 860px) {
          .dash {
            grid-template-columns: 1fr;
          }
          .total {
            font-size: 38px;
          }
        }
      `}</style>
    </div>
  );
}
