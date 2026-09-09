"use client";

import { useMemo } from "react";
import { Expense } from "@/lib/supabaseClient";
import { formatMoney } from "@/lib/config";
import CollapsibleCard from "./CollapsibleCard";
import FilterBar, { Filters } from "./FilterBar";

type Props = {
  allExpenses: Expense[]; // for fixed quick-range tiles, independent of the active filter
  rangeExpenses: Expense[]; // whatever the filter bar currently selects
  rangeLabel: string;
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  onQuickRange: (days: number | "month" | "all") => void;
};

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function DashboardStats({
  allExpenses,
  rangeExpenses,
  rangeLabel,
  filters,
  onFiltersChange,
  onQuickRange,
}: Props) {
  const quick = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const sevenAgo = isoDaysAgo(6); // includes today = 7 days
    const thirtyAgo = isoDaysAgo(29);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10);

    const sum = (from: string) =>
      allExpenses.filter((e) => e.spent_on >= from && e.spent_on <= today).reduce((s, e) => s + Number(e.amount), 0);

    return {
      last7: sum(sevenAgo),
      last30: sum(thirtyAgo),
      thisMonth: sum(monthStart),
      allTimeCount: allExpenses.length,
    };
  }, [allExpenses]);

  const stats = useMemo(() => {
    const total = rangeExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const count = rangeExpenses.length;

    const byDay = new Map<string, number>();
    for (const e of rangeExpenses) {
      byDay.set(e.spent_on, (byDay.get(e.spent_on) ?? 0) + Number(e.amount));
    }
    const days = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const maxDay = Math.max(1, ...days.map((d) => d[1]));
    const activeDays = days.length || 1;
    const avgPerDay = total / activeDays;
    const topDay = days.reduce((m, d) => (d[1] > m[1] ? d : m), ["", 0] as [string, number]);

    return { total, count, days, maxDay, avgPerDay, topDay };
  }, [rangeExpenses]);

  return (
    <CollapsibleCard eyebrow="Overview" title="Dashboard" subtitle="Filter your range, see quick totals, then the pulse.">
      <div className="filter-slot">
        <FilterBar filters={filters} onChange={onFiltersChange} onQuickRange={onQuickRange} bare />
      </div>

      <div className="quick-grid">
        <div className="quick-tile">
          <span className="label">Last 7 days</span>
          <span className="value tab-nums">{formatMoney(quick.last7)}</span>
        </div>
        <div className="quick-tile">
          <span className="label">Last 30 days</span>
          <span className="value tab-nums">{formatMoney(quick.last30)}</span>
        </div>
        <div className="quick-tile">
          <span className="label">This month</span>
          <span className="value tab-nums">{formatMoney(quick.thisMonth)}</span>
        </div>
        <div className="quick-tile">
          <span className="label">All entries logged</span>
          <span className="value tab-nums">{quick.allTimeCount}</span>
        </div>
      </div>

      <div className="pulse">
        <div className="pulse-top">
          <span className="eyebrow2">Total · {rangeLabel}</span>
          <div className="total tab-nums">{formatMoney(stats.total)}</div>
          <div className="sub tab-nums">
            {stats.count} {stats.count === 1 ? "entry" : "entries"} · {formatMoney(stats.avgPerDay)} / active day
          </div>
        </div>

        <div className="pulse-bars" aria-hidden>
          {stats.days.length === 0 ? (
            <div className="pulse-empty">No spending in this range yet.</div>
          ) : (
            stats.days.map(([day, amt]) => (
              <div className="bar-wrap" key={day} title={`${day}: ${formatMoney(amt)}`}>
                <div className="bar" style={{ height: `${Math.max(6, (amt / stats.maxDay) * 100)}%` }} />
              </div>
            ))
          )}
        </div>
        <div className="pulse-axis">
          <span>Daily rhythm</span>
          {stats.topDay[0] && <span className="tab-nums">Peak {formatMoney(stats.topDay[1])}</span>}
        </div>
      </div>

      <style jsx>{`
        .filter-slot {
          padding-bottom: 22px;
          margin-bottom: 22px;
          border-bottom: 1px solid var(--line);
        }
        .quick-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 22px;
        }
        .quick-tile {
          background: var(--ink);
          border: 1px solid var(--line);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .quick-tile .label {
          font-size: 11px;
          color: var(--text-faint);
        }
        .quick-tile .value {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 17px;
          color: var(--text);
        }
        .pulse {
          border-top: 1px solid var(--line);
          padding-top: 20px;
        }
        .eyebrow2 {
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-faint);
        }
        .total {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 40px;
          line-height: 1.05;
          margin-top: 8px;
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
          height: 110px;
          margin-top: 24px;
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
        @media (max-width: 720px) {
          .quick-grid {
            grid-template-columns: 1fr 1fr;
          }
          .total {
            font-size: 32px;
          }
        }
      `}</style>
    </CollapsibleCard>
  );
}
