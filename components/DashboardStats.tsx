"use client";

import { useMemo } from "react";
import { Expense, IncomeEntry, RecurringBill, SavingsGoal, Profile } from "@/lib/supabaseClient";
import { formatMoney, categoryByKey, formatDate } from "@/lib/config";
import CollapsibleCard from "./CollapsibleCard";
import FilterBar, { Filters } from "./FilterBar";

type Props = {
  profile: Profile;
  allExpenses: Expense[]; // for fixed quick-range tiles, independent of the active filter
  allIncome: IncomeEntry[];
  bills: RecurringBill[];
  goals: SavingsGoal[];
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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardStats({
  profile,
  allExpenses,
  allIncome,
  bills,
  goals,
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

  const parity = useMemo(() => {
    if (!profile.monthly_income || profile.monthly_income <= 0) return null;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const spentThisMonth = allExpenses
      .filter((e) => e.spent_on >= monthStart)
      .reduce((s, e) => s + Number(e.amount), 0);
    const ratio = spentThisMonth / profile.monthly_income;
    return { spentThisMonth, income: profile.monthly_income, ratio };
  }, [allExpenses, profile.monthly_income]);

  const insights = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

    const thisMonthTotal = allExpenses
      .filter((e) => e.spent_on >= thisMonthStart)
      .reduce((s, e) => s + Number(e.amount), 0);
    const lastMonthTotal = allExpenses
      .filter((e) => e.spent_on >= lastMonthStart && e.spent_on <= lastMonthEnd)
      .reduce((s, e) => s + Number(e.amount), 0);

    let momChange: number | null = null;
    if (lastMonthTotal > 0) momChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;

    const byCat = new Map<string, number>();
    for (const e of rangeExpenses) byCat.set(e.category, (byCat.get(e.category) ?? 0) + Number(e.amount));
    const topCatEntry = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
    const topCategory = topCatEntry ? { ...categoryByKey(topCatEntry[0]), amount: topCatEntry[1] } : null;

    const biggest = [...rangeExpenses].sort((a, b) => Number(b.amount) - Number(a.amount))[0] ?? null;

    return { thisMonthTotal, lastMonthTotal, momChange, topCategory, biggest };
  }, [allExpenses, rangeExpenses]);

  const trend = useMemo(() => {
    const months: { key: string; label: string; expense: number; income: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-GB", { month: "short" });
      months.push({ key, label, expense: 0, income: 0 });
    }
    const monthKey = (dateStr: string) => dateStr.slice(0, 7);
    for (const e of allExpenses) {
      const m = months.find((x) => x.key === monthKey(e.spent_on));
      if (m) m.expense += Number(e.amount);
    }
    for (const inc of allIncome) {
      const m = months.find((x) => x.key === monthKey(inc.received_on));
      if (m) m.income += Number(inc.amount);
    }
    const max = Math.max(1, ...months.map((m) => Math.max(m.expense, m.income)));
    return { months, max };
  }, [allExpenses, allIncome]);

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

      {parity && (
        <div className="parity">
          <div className="parity-head">
            <span>Income vs expenses this month</span>
            <span className={`tab-nums ${parity.ratio >= 1 ? "over" : parity.ratio >= 0.8 ? "watch" : ""}`}>
              {formatMoney(parity.spentThisMonth)} / {formatMoney(parity.income)} ({Math.round(parity.ratio * 100)}%)
            </span>
          </div>
          <div className="parity-track">
            <div
              className={`parity-fill ${parity.ratio >= 1 ? "over" : parity.ratio >= 0.8 ? "watch" : "ok"}`}
              style={{ width: `${Math.min(100, parity.ratio * 100)}%` }}
            />
          </div>
        </div>
      )}

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
            <div className="pulse-empty">No expenses in this range yet.</div>
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

      <div className="insights">
        <div className="insight-tile">
          <span className="i-label">Vs last month</span>
          {insights.momChange === null ? (
            <span className="i-value">No data last month</span>
          ) : (
            <span className={`i-value tab-nums ${insights.momChange > 0 ? "up" : insights.momChange < 0 ? "down" : ""}`}>
              {insights.momChange > 0 ? "▲" : insights.momChange < 0 ? "▼" : "—"} {Math.abs(insights.momChange).toFixed(0)}%
            </span>
          )}
          <span className="i-sub tab-nums">{formatMoney(insights.thisMonthTotal)} this month</span>
        </div>

        <div className="insight-tile">
          <span className="i-label">Top category · {rangeLabel}</span>
          {insights.topCategory ? (
            <>
              <span className="i-value">
                <span className="cat-dot" style={{ background: insights.topCategory.color }} />
                {insights.topCategory.label}
              </span>
              <span className="i-sub tab-nums">{formatMoney(insights.topCategory.amount)}</span>
            </>
          ) : (
            <span className="i-value muted">No expenses yet</span>
          )}
        </div>

        <div className="insight-tile">
          <span className="i-label">Biggest single expense · {rangeLabel}</span>
          {insights.biggest ? (
            <>
              <span className="i-value">{insights.biggest.title}</span>
              <span className="i-sub tab-nums">{formatMoney(insights.biggest.amount)}</span>
            </>
          ) : (
            <span className="i-value muted">No expenses yet</span>
          )}
        </div>
      </div>

      <div className="trend">
        <div className="trend-head">
          <span className="i-label">Last 6 months</span>
          <div className="trend-legend">
            <span className="legend-item"><span className="dot spend" /> Expenses</span>
            <span className="legend-item"><span className="dot income" /> Income</span>
          </div>
        </div>
        <div className="trend-chart">
          {trend.months.map((m) => (
            <div className="trend-col" key={m.key}>
              <div className="trend-bars">
                <div
                  className="trend-bar spend"
                  style={{ height: `${Math.max(2, (m.expense / trend.max) * 100)}%` }}
                  title={`Spend: ${formatMoney(m.expense)}`}
                />
                <div
                  className="trend-bar income"
                  style={{ height: `${Math.max(2, (m.income / trend.max) * 100)}%` }}
                  title={`Income: ${formatMoney(m.income)}`}
                />
              </div>
              <span className="trend-label">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {(bills.length > 0 || goals.length > 0) && (
        <div className="glance">
          <span className="i-label">Bills & goals at a glance</span>
          <div className="glance-grid">
            {bills.slice(0, 3).map((b) => {
              const due = b.next_due_date <= todayStr();
              return (
                <div className="glance-tile" key={b.id}>
                  <span className="glance-icon">📅</span>
                  <div className="glance-body">
                    <span className="glance-title">{b.title}</span>
                    <span className={`glance-sub ${due ? "due" : ""}`}>
                      {due ? "Due now" : `Due ${formatDate(b.next_due_date)}`} · {formatMoney(b.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
            {goals.slice(0, 3).map((g) => {
              const pct = Math.min(100, (Number(g.current_amount) / Number(g.target_amount)) * 100);
              return (
                <div className="glance-tile" key={g.id}>
                  <span className="glance-icon">🎯</span>
                  <div className="glance-body">
                    <span className="glance-title">{g.name}</span>
                    <div className="glance-track">
                      <div className="glance-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="glance-sub">{Math.round(pct)}% of {formatMoney(g.target_amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
        .parity {
          margin-bottom: 22px;
          padding-bottom: 22px;
          border-bottom: 1px solid var(--line);
        }
        .parity-head {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 6px 12px;
          font-size: 13px;
          color: var(--text-dim);
          margin-bottom: 8px;
        }
        .parity-head .over {
          color: var(--coral);
          font-weight: 600;
        }
        .parity-head .watch {
          color: var(--amber);
          font-weight: 600;
        }
        .parity-track {
          height: 8px;
          background: var(--ink-3);
          border-radius: 6px;
          overflow: hidden;
        }
        .parity-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.4s ease;
        }
        .parity-fill.ok {
          background: var(--mint);
        }
        .parity-fill.watch {
          background: var(--amber);
        }
        .parity-fill.over {
          background: var(--coral);
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
        .insights {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 22px;
          padding-top: 22px;
          border-top: 1px solid var(--line);
        }
        .insight-tile {
          background: var(--ink);
          border: 1px solid var(--line);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .i-label {
          font-size: 11px;
          color: var(--text-faint);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .i-value {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 15px;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .i-value.muted {
          color: var(--text-faint);
          font-weight: 500;
          font-size: 13px;
        }
        .i-value.up {
          color: var(--coral);
        }
        .i-value.down {
          color: var(--mint);
        }
        .i-sub {
          font-size: 12px;
          color: var(--text-dim);
        }
        .cat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .glance {
          margin-top: 22px;
          padding-top: 22px;
          border-top: 1px solid var(--line);
        }
        .glance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
          margin-top: 12px;
        }
        .glance-tile {
          background: var(--ink);
          border: 1px solid var(--line);
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .glance-icon {
          font-size: 16px;
          flex-shrink: 0;
        }
        .glance-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
          flex: 1;
        }
        .glance-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .glance-sub {
          font-size: 11px;
          color: var(--text-faint);
        }
        .glance-sub.due {
          color: var(--amber);
          font-weight: 600;
        }
        .glance-track {
          height: 5px;
          background: var(--ink-3);
          border-radius: 4px;
          overflow: hidden;
          margin: 2px 0;
        }
        .glance-fill {
          height: 100%;
          background: var(--mint);
          border-radius: 4px;
        }
        .trend {
          margin-top: 22px;
          padding-top: 22px;
          border-top: 1px solid var(--line);
        }
        .trend-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 18px;
        }
        .trend-legend {
          display: flex;
          gap: 14px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-faint);
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .dot.spend {
          background: var(--amber);
        }
        .dot.income {
          background: var(--mint);
        }
        .trend-chart {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 8px;
          height: 140px;
        }
        .trend-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }
        .trend-bars {
          flex: 1;
          display: flex;
          align-items: flex-end;
          gap: 3px;
          width: 100%;
          justify-content: center;
        }
        .trend-bar {
          width: 30%;
          max-width: 16px;
          border-radius: 3px 3px 1px 1px;
          transition: height 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .trend-bar.spend {
          background: linear-gradient(180deg, var(--amber), rgba(232, 163, 61, 0.35));
        }
        .trend-bar.income {
          background: linear-gradient(180deg, var(--mint), rgba(79, 209, 165, 0.35));
        }
        .trend-label {
          margin-top: 8px;
          font-size: 11px;
          color: var(--text-faint);
        }
        @media (max-width: 720px) {
          .quick-grid {
            grid-template-columns: 1fr 1fr;
          }
          .insights {
            grid-template-columns: 1fr;
          }
          .total {
            font-size: 32px;
          }
        }
      `}</style>
    </CollapsibleCard>
  );
}
