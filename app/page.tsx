"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, Expense, isConfigured } from "@/lib/supabaseClient";
import { formatDate, isAdminRole, hasFeature } from "@/lib/config";
import { useAuth } from "@/lib/auth";
import ExpenseForm from "@/components/ExpenseForm";
import FilterBar, { Filters } from "@/components/FilterBar";
import DashboardStats from "@/components/DashboardStats";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import FinanceCard from "@/components/FinanceCard";
import ReportsBar from "@/components/ReportsBar";
import EntriesManager from "@/components/EntriesManager";
import ManageUsersCard from "@/components/ManageUsersCard";
import CollapsibleCard from "@/components/CollapsibleCard";
import ThemeToggle from "@/components/ThemeToggle";

const isoDaysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const todayIso = () => new Date().toISOString().slice(0, 10);

const configured = isConfigured;

export default function Home() {
  const router = useRouter();
  const { loading: authLoading, session, profile, superAdminExists, signOut, refreshProfile } = useAuth();
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
    if (!configured || !session) {
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
  }, [session]);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.replace(superAdminExists === false ? "/setup" : "/login");
      return;
    }
    load();
  }, [authLoading, session, superAdminExists, router, load]);

  // If an admin deactivates this account while it's open in another tab,
  // pick that up as soon as the tab regains focus rather than only on the
  // next full page load.
  useEffect(() => {
    if (!session) return;
    function onVisible() {
      if (document.visibilityState === "visible") refreshProfile();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [session, refreshProfile]);

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

  if (!authLoading && configured && !session) {
    // Redirect is in flight (see effect above); render nothing to avoid a
    // flash of the tracker before it lands on /login or /setup.
    return null;
  }

  if (profile && !profile.is_active) {
    return (
      <main className="wrap">
        <div className="notice err">
          Your account has been deactivated. Contact your admin to have it re-enabled.
        </div>
        <button className="signout-standalone" onClick={() => signOut()}>Sign out</button>
      </main>
    );
  }

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
        <div className="topbar-right">
          <ThemeToggle />
          <span className="pill">Naira · NGN</span>
          {session && (
            <button className="signout" onClick={() => signOut()}>Sign out</button>
          )}
        </div>
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
        {session && (
          <ExpenseForm userId={session.user.id} profile={profile} allExpenses={all} onSaved={load} />
        )}

        <FilterBar filters={filters} onChange={setFilters} onQuickRange={quickRange} />

        {loading ? (
          <div className="loading">Loading your dashboard…</div>
        ) : (
          <>
            {/* 1. Dashboard — quick totals + range pulse */}
            <DashboardStats allExpenses={all} rangeExpenses={filtered} rangeLabel={rangeLabel} />

            {/* 2. What did you spend on */}
            {profile && hasFeature(profile.features, "category_insights") && (
              <CategoryBreakdown expenses={filtered} rangeLabel={rangeLabel} />
            )}

            {/* 3. Budgets, projector & income — one combined card */}
            {profile && (
              <FinanceCard profile={profile} allExpenses={all} onIncomeSaved={refreshProfile} />
            )}

            {/* 4. Reports */}
            {profile && (hasFeature(profile.features, "pdf_export") || hasFeature(profile.features, "csv_export")) && (
              <CollapsibleCard
                eyebrow="Export"
                title="Reports"
                subtitle="A PDF or CSV of whatever range is currently filtered above."
              >
                <ReportsBar
                  expenses={filtered}
                  rangeLabel={rangeLabel}
                  pdfEnabled={hasFeature(profile.features, "pdf_export")}
                  csvEnabled={hasFeature(profile.features, "csv_export")}
                  bare
                />
              </CollapsibleCard>
            )}

            <EntriesManager expenses={filtered} onChanged={load} />

            {/* 5. Manage users — admin-tier accounts only, same page as everyone else */}
            {profile && isAdminRole(profile.role) && session && (
              <ManageUsersCard currentUserId={session.user.id} />
            )}
          </>
        )}
      </section>

      <footer className="foot">
        <span>Personal spend, tracked clean · budgets, accounts and features are admin-managed.</span>
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
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .signout {
          background: transparent;
          border: none;
          color: var(--text-faint);
          font-size: 13px;
          padding: 8px 4px;
        }
        .signout:hover {
          color: var(--coral);
        }
        .signout-standalone {
          margin-top: 16px;
          background: transparent;
          border: 1px solid var(--line-strong);
          color: var(--text);
          border-radius: var(--radius-sm);
          padding: 10px 18px;
          font-size: 14px;
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
