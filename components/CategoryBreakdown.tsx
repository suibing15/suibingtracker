"use client";

import { useMemo } from "react";
import { Expense } from "@/lib/supabaseClient";
import { categoryByKey, formatMoney } from "@/lib/config";
import CollapsibleCard from "./CollapsibleCard";

type Props = { expenses: Expense[]; rangeLabel: string };

export default function CategoryBreakdown({ expenses, rangeLabel }: Props) {
  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const byCat = new Map<string, number>();
    for (const e of expenses) {
      byCat.set(e.category, (byCat.get(e.category) ?? 0) + Number(e.amount));
    }
    const cats = [...byCat.entries()]
      .map(([key, value]) => ({ ...categoryByKey(key), value }))
      .sort((a, b) => b.value - a.value);
    return { total, cats };
  }, [expenses]);

  return (
    <CollapsibleCard
      eyebrow="Breakdown"
      title="What did you spend on"
      subtitle={`Category share for ${rangeLabel}.`}
    >
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
                  <div className="fill" style={{ width: `${pct}%`, background: c.color }} />
                </div>
                <span className="cat-pct tab-nums">{pct.toFixed(0)}%</span>
              </li>
            );
          })}
        </ul>
      )}

      <style jsx>{`
        .cat-list {
          list-style: none;
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
        }
      `}</style>
    </CollapsibleCard>
  );
}
