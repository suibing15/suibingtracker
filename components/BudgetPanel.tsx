"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, Budget, Expense, Profile } from "@/lib/supabaseClient";
import { CATEGORIES, categoryByKey, formatMoney } from "@/lib/config";

type Props = { profile: Profile; expenses: Expense[]; bare?: boolean };

const todayIso = () => new Date().toISOString().slice(0, 10);
const monthStartIso = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

function ProgressBar({ spent, limit }: { spent: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const over = limit > 0 && spent > limit;
  return (
    <div className="track">
      <div
        className={`fill ${over ? "over" : pct > 80 ? "warn" : "ok"}`}
        style={{ width: `${Math.max(pct, spent > 0 ? 3 : 0)}%` }}
      />
      <style jsx>{`
        .track {
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
        .fill.ok {
          background: var(--mint);
        }
        .fill.warn {
          background: var(--amber);
        }
        .fill.over {
          background: var(--coral);
        }
      `}</style>
    </div>
  );
}

export default function BudgetPanel({ profile, expenses, bare = false }: Props) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [limit, setLimit] = useState("");
  const [period, setPeriod] = useState<"daily" | "monthly">("monthly");
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "error"; msg?: string }>({
    kind: "idle",
  });

  const loadBudgets = async () => {
    setLoading(true);
    const { data } = await supabase.from("budgets").select("*").order("created_at", { ascending: true });
    setBudgets((data as Budget[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const today = todayIso();
  const monthStart = monthStartIso();

  const spendToday = useMemo(
    () => expenses.filter((e) => e.spent_on === today).reduce((s, e) => s + Number(e.amount), 0),
    [expenses, today]
  );
  const spendThisMonth = useMemo(
    () => expenses.filter((e) => e.spent_on >= monthStart).reduce((s, e) => s + Number(e.amount), 0),
    [expenses, monthStart]
  );

  const streakDays = useMemo(() => {
    // Consecutive days (working back from yesterday) where the day's total
    // spend stayed at or under the daily cap. A simple, visible accountability
    // signal — only meaningful once a daily budget is set.
    if (!profile.daily_budget) return null;
    const byDay = new Map<string, number>();
    for (const e of expenses) byDay.set(e.spent_on, (byDay.get(e.spent_on) ?? 0) + Number(e.amount));
    let streak = 0;
    for (let i = 1; i < 366; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const spent = byDay.get(iso) ?? 0;
      if (spent === 0 && !byDay.has(iso)) {
        // No entries logged that day at all — stop counting rather than
        // reward silence.
        break;
      }
      if (spent <= profile.daily_budget) streak++;
      else break;
    }
    return streak;
  }, [expenses, profile.daily_budget]);

  async function addCategoryBudget() {
    const numLimit = parseFloat(limit);
    if (!numLimit || numLimit <= 0) {
      setStatus({ kind: "error", msg: "Enter a limit amount greater than zero." });
      return;
    }
    setStatus({ kind: "busy" });
    const { error } = await supabase
      .from("budgets")
      .upsert(
        { user_id: profile.id, category, period, limit_amount: numLimit },
        { onConflict: "user_id,category,period" }
      );
    if (error) {
      setStatus({ kind: "error", msg: error.message });
      return;
    }
    setLimit("");
    setStatus({ kind: "idle" });
    loadBudgets();
  }

  async function removeBudget(id: string) {
    await supabase.from("budgets").delete().eq("id", id);
    loadBudgets();
  }

  const categorySpend = (cat: string, period: "daily" | "monthly") => {
    const from = period === "daily" ? today : monthStart;
    return expenses
      .filter((e) => e.category === cat && e.spent_on >= from)
      .reduce((s, e) => s + Number(e.amount), 0);
  };

  return (
    <div className={`budget-card ${bare ? "bare" : ""}`}>
      <div className="head">
        <span className="eyebrow">Stay on track</span>
        <h2>Budgets & limits</h2>
      </div>

      {(profile.daily_budget || profile.monthly_budget) && (
        <div className="caps">
          {profile.daily_budget != null && (
            <div className="cap-row">
              <div className="cap-head">
                <span>Daily cap</span>
                <span className={`tab-nums ${spendToday > profile.daily_budget ? "over" : ""}`}>
                  {formatMoney(spendToday)} / {formatMoney(profile.daily_budget)}
                </span>
              </div>
              <ProgressBar spent={spendToday} limit={profile.daily_budget} />
              {spendToday > profile.daily_budget && (
                <p className="warn-line">
                  Over today's cap by {formatMoney(spendToday - profile.daily_budget)}.
                </p>
              )}
            </div>
          )}
          {profile.monthly_budget != null && (
            <div className="cap-row">
              <div className="cap-head">
                <span>Monthly cap</span>
                <span className={`tab-nums ${spendThisMonth > profile.monthly_budget ? "over" : ""}`}>
                  {formatMoney(spendThisMonth)} / {formatMoney(profile.monthly_budget)}
                </span>
              </div>
              <ProgressBar spent={spendThisMonth} limit={profile.monthly_budget} />
              {spendThisMonth > profile.monthly_budget && (
                <p className="warn-line">
                  Over this month's cap by {formatMoney(spendThisMonth - profile.monthly_budget)}.
                </p>
              )}
            </div>
          )}
          {streakDays !== null && (
            <p className="streak">
              🔥 {streakDays} {streakDays === 1 ? "day" : "days"} in a row within your daily cap.
            </p>
          )}
        </div>
      )}
      {!profile.daily_budget && !profile.monthly_budget && (
        <p className="empty">
          No overall spend cap set yet. Ask your admin to set a daily or monthly cap from the admin panel.
        </p>
      )}

      <div className="divider" />

      <span className="label">Category budgets</span>
      {loading ? (
        <p className="empty">Loading…</p>
      ) : budgets.length === 0 ? (
        <p className="empty">No category budgets yet — add one below.</p>
      ) : (
        <div className="cat-budgets">
          {budgets.map((b) => {
            const cat = b.category ? categoryByKey(b.category) : { label: "Overall", color: "#9AA3B8" };
            const spent = b.category
              ? categorySpend(b.category, b.period)
              : (b.period === "daily" ? spendToday : spendThisMonth);
            return (
              <div className="cat-row" key={b.id}>
                <div className="cat-head">
                  <span className="dot" style={{ background: cat.color }} />
                  <span className="cat-name">
                    {cat.label} · {b.period === "daily" ? "daily" : "monthly"}
                  </span>
                  <span className="tab-nums">{formatMoney(spent)} / {formatMoney(b.limit_amount)}</span>
                  <button className="remove" onClick={() => removeBudget(b.id)} aria-label="Remove">✕</button>
                </div>
                <ProgressBar spent={spent} limit={b.limit_amount} />
              </div>
            );
          })}
        </div>
      )}

      <div className="add-row">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
        <select value={period} onChange={(e) => setPeriod(e.target.value as "daily" | "monthly")}>
          <option value="monthly">Monthly</option>
          <option value="daily">Daily</option>
        </select>
        <input
          className="tab-nums"
          inputMode="decimal"
          value={limit}
          onChange={(e) => setLimit(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="Limit (₦)"
        />
        <button className="add-btn" onClick={addCategoryBudget} disabled={status.kind === "busy"}>
          Add
        </button>
      </div>
      {status.msg && <p className="msg error">{status.msg}</p>}

      <style jsx>{`
        .budget-card {
          background: linear-gradient(180deg, var(--ink-2), var(--ink));
          border: 1px solid var(--line-strong);
          border-radius: var(--radius);
          padding: 26px;
          box-shadow: var(--shadow);
        }
        .budget-card.bare {
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
        .head h2 {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 20px;
          margin-top: 6px;
        }
        .caps {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .cap-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cap-head {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-dim);
        }
        .cap-head .over {
          color: var(--coral);
          font-weight: 600;
        }
        .warn-line {
          font-size: 12px;
          color: var(--coral);
        }
        .streak {
          font-size: 13px;
          color: var(--text);
          margin-top: 4px;
        }
        .divider {
          height: 1px;
          background: var(--line);
          margin: 22px 0;
        }
        .label {
          font-size: 12px;
          color: var(--text-dim);
          font-weight: 500;
        }
        .empty {
          color: var(--text-faint);
          font-size: 13px;
          margin-top: 10px;
        }
        .cat-budgets {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 12px;
        }
        .cat-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .cat-head {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .cat-name {
          color: var(--text);
        }
        .cat-head .tab-nums {
          margin-left: auto;
          color: var(--text-dim);
        }
        .remove {
          background: transparent;
          border: none;
          color: var(--text-faint);
          font-size: 11px;
          padding: 2px 4px;
        }
        .remove:hover {
          color: var(--coral);
        }
        .add-row {
          display: grid;
          grid-template-columns: 1.3fr 0.9fr 1fr auto;
          gap: 8px;
          margin-top: 18px;
        }
        select,
        input {
          background: var(--ink);
          border: 1px solid var(--line-strong);
          border-radius: var(--radius-sm);
          color: var(--text);
          padding: 10px 12px;
          font-size: 13px;
        }
        select:focus,
        input:focus {
          outline: none;
          border-color: var(--amber);
        }
        .add-btn {
          background: var(--amber);
          color: #201603;
          border: none;
          border-radius: var(--radius-sm);
          padding: 10px 16px;
          font-weight: 600;
          font-size: 13px;
        }
        .msg.error {
          color: var(--coral);
          font-size: 12px;
          margin-top: 10px;
        }
        @media (max-width: 640px) {
          .add-row {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}
