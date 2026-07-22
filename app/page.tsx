"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, Expense, isConfigured } from "@/lib/supabaseClient";
import { formatDate } from "@/lib/config";
import ExpenseForm from "@/components/ExpenseForm";
import Dashboard from "@/components/Dashboard";
import FilterBar, { Filters } from "@/components/FilterBar";
import ExpenseTable from "@/components/ExpenseTable";

const isoDaysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const todayIso = () => new Date().toISOString().slice(0, 10);

const configured = isConfigured;

export default function Home() {
  const [all, setAll] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    from: isoDaysAgo(30),
    to: todayIso(),
    category: "all",
    search: "",
  });

  const load = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("spent_on", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setAll((data as Expense[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return all.filter((e) => {
      if (filters.from && e.spent_on < filters.from) return false;
      if (filters.to && e.spent_on > filters.to) return false;
      if (filters.category !== "all" && e.category !== filters.category) return false;
      if (q) {
        const hay = (e.title + " " + (e.note ?? "")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, filters]);

  const rangeLabel = useMemo(() => {
    if (!filters.from && !filters.to) return "All time";
    return `${formatDate(filters.from)} – ${formatDate(filters.to)}`;
  }, [filters.from, filters.to]);

  const quickRange = (r: number | "month" | "all") => {
    if (r === "all") setFilters({ ...filters, from: "", to: "" });
    else if (r === "month") {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setFilters({
        ...filters,
        from: first.toISOString().slice(0, 10),
        to: todayIso(),
      });
    } else {
      setFilters({ ...filters, from: isoDaysAgo(r), to: todayIso() });
    }
  };

  return (
    <main className="wrap">
      <header className="topbar">
        <div className="brand">
          <span className="mark">◈</span>
          <div>
            <h1>suibingtracker</h1>
            <p>Daily expenses, tracked clean.</p>
          </div>
        </div>
        <span className="pill">Naira · NGN</span>
      </header>

      {!configured && (
        <div className="notice">
          <strong>Connect Supabase to go live.</strong> Add{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your Vercel project settings
          (or a local <code>.env.local</code>), then run the SQL in{" "}
          <code>supabase/schema.sql</code>. The interface below is fully built and
          will start reading and writing once the keys are in place.
        </div>
      )}

      {error && <div className="notice err">Error: {error}</div>}

      <section className="stack">
        <ExpenseForm onSaved={load} />
        <Dashboard expenses={filtered} rangeLabel={rangeLabel} />
        <FilterBar filters={filters} onChange={setFilters} onQuickRange={quickRange} />
        {loading ? (
          <div className="loading">Loading your expenses…</div>
        ) : (
          <ExpenseTable expenses={filtered} rangeLabel={rangeLabel} onChanged={load} />
        )}
      </section>

      <footer className="foot">
        <span>Built to be extended · categories, budgets and auth are next.</span>
      </footer>

      <style jsx>{`
        .wrap {
          max-width: 1080px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .mark {
          font-size: 30px;
          color: var(--amber);
          line-height: 1;
        }
        .brand h1 {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 26px;
          letter-spacing: -0.01em;
        }
        .brand p {
          color: var(--text-dim);
          font-size: 13px;
          margin-top: 2px;
        }
        .pill {
          font-family: var(--font-display);
          font-size: 12px;
          letter-spacing: 0.08em;
          color: var(--amber);
          border: 1px solid var(--line-strong);
          border-radius: 999px;
          padding: 8px 16px;
        }
        .notice {
          background: rgba(232, 163, 61, 0.1);
          border: 1px solid rgba(232, 163, 61, 0.35);
          border-radius: var(--radius-sm);
          padding: 16px 18px;
          font-size: 14px;
          color: var(--parchment);
          line-height: 1.6;
          margin-bottom: 22px;
        }
        .notice.err {
          background: rgba(240, 106, 106, 0.1);
          border-color: rgba(240, 106, 106, 0.4);
        }
        .notice code {
          background: var(--ink);
          padding: 2px 6px;
          border-radius: 5px;
          font-size: 12px;
          color: var(--amber-soft);
        }
        .stack {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .loading {
          color: var(--text-faint);
          padding: 40px;
          text-align: center;
        }
        .foot {
          margin-top: 40px;
          text-align: center;
          color: var(--text-faint);
          font-size: 12px;
        }
      `}</style>
    </main>
  );
}
