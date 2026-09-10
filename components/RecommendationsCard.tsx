"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, Recommendation, RecommendationType } from "@/lib/supabaseClient";
import CollapsibleCard from "./CollapsibleCard";

type NameLookup = Record<string, { name: string; email: string }>;

const TYPE_LABELS: Record<RecommendationType, string> = {
  recommendation: "Recommendation",
  feature_request: "Feature request",
  complaint: "Complaint",
  cap_increase_request: "Cap increase request",
};

const FILTER_OPTIONS: { value: "all" | RecommendationType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "recommendation", label: "Recommendations" },
  { value: "feature_request", label: "Feature requests" },
  { value: "complaint", label: "Complaints" },
  { value: "cap_increase_request", label: "Cap increase requests" },
];

export default function RecommendationsCard() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [names, setNames] = useState<NameLookup>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | RecommendationType>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const [recRes, profRes] = await Promise.all([
      supabase.from("recommendations").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, email, full_name"),
    ]);
    if (recRes.error) setErr(recRes.error.message);
    else setRecs((recRes.data as Recommendation[]) ?? []);

    if (profRes.data) {
      const lookup: NameLookup = {};
      for (const p of profRes.data as { id: string; email: string; full_name: string | null }[]) {
        lookup[p.id] = { name: p.full_name || p.email, email: p.email };
      }
      setNames(lookup);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this recommendation?")) return;
    await supabase.from("recommendations").delete().eq("id", id);
    load();
  }

  const filteredRecs = useMemo(
    () => (filter === "all" ? recs : recs.filter((r) => r.type === filter)),
    [recs, filter]
  );

  const byUser = useMemo(() => {
    const counts = new Map<string, { count: number; avgRating: number | null; ratingSum: number; ratingCount: number }>();
    for (const r of recs) {
      const entry = counts.get(r.user_id) ?? { count: 0, avgRating: null, ratingSum: 0, ratingCount: 0 };
      entry.count += 1;
      if (r.rating != null) {
        entry.ratingSum += r.rating;
        entry.ratingCount += 1;
      }
      counts.set(r.user_id, entry);
    }
    const rows = [...counts.entries()].map(([userId, v]) => ({
      userId,
      name: names[userId]?.name ?? "Unknown",
      count: v.count,
      avgRating: v.ratingCount > 0 ? v.ratingSum / v.ratingCount : null,
    }));
    rows.sort((a, b) => b.count - a.count);
    const max = Math.max(1, ...rows.map((r) => r.count));
    return { rows, max };
  }, [recs, names]);

  return (
    <CollapsibleCard
      eyebrow="Admin"
      title="Recommendations & feedback"
      subtitle="What users are telling you, and how much each one is engaging with feedback."
      badge={`${recs.length} total`}
      defaultOpen={false}
    >
      {loading ? (
        <p className="loading">Loading…</p>
      ) : (
        <>
          {err && <p className="msg error">{err}</p>}

          {byUser.rows.length > 0 && (
            <div className="chart">
              <span className="chart-label">Submissions per user (all types)</span>
              {byUser.rows.map((r) => (
                <div className="chart-row" key={r.userId}>
                  <span className="chart-name">{r.name}</span>
                  <div className="chart-track">
                    <div className="chart-fill" style={{ width: `${(r.count / byUser.max) * 100}%` }} />
                  </div>
                  <span className="chart-count tab-nums">
                    {r.count}
                    {r.avgRating != null && <span className="chart-rating"> · {r.avgRating.toFixed(1)}★</span>}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="filter-row">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`filter-btn ${filter === opt.value ? "on" : ""}`}
                onClick={() => setFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="list">
            {filteredRecs.length === 0 ? (
              <p className="empty">Nothing here yet.</p>
            ) : (
              filteredRecs.map((r) => (
                <div className="rec" key={r.id}>
                  <div className="rec-head">
                    <span className="rec-name">{names[r.user_id]?.name ?? "Unknown"}</span>
                    <span className={`type-chip type-${r.type}`}>{TYPE_LABELS[r.type]}</span>
                    {r.rating != null && <span className="rec-stars">{"★".repeat(r.rating)}</span>}
                    <span className="rec-date">
                      {new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <button className="del" onClick={() => remove(r.id)} aria-label="Delete">✕</button>
                  </div>
                  <p className="rec-msg">{r.message}</p>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .loading {
          color: var(--text-faint);
          font-size: 13px;
        }
        .msg.error {
          color: var(--coral);
          font-size: 12px;
          margin-bottom: 12px;
        }
        .chart {
          margin-bottom: 26px;
          padding-bottom: 22px;
          border-bottom: 1px solid var(--line);
        }
        .chart-label {
          display: block;
          font-size: 12px;
          color: var(--text-dim);
          margin-bottom: 14px;
        }
        .chart-row {
          display: grid;
          grid-template-columns: 120px 1fr 70px;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          font-size: 13px;
        }
        .chart-name {
          color: var(--text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .chart-track {
          height: 8px;
          background: var(--ink-3);
          border-radius: 6px;
          overflow: hidden;
        }
        .chart-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--amber), var(--amber-soft));
          border-radius: 6px;
          transition: width 0.4s ease;
        }
        .chart-count {
          color: var(--text-dim);
          text-align: right;
          white-space: nowrap;
        }
        .chart-rating {
          color: var(--amber);
        }
        .list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .empty {
          color: var(--text-faint);
          font-size: 13px;
        }
        .rec {
          background: var(--ink);
          border: 1px solid var(--line);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
        }
        .filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 18px;
        }
        .filter-btn {
          background: var(--ink);
          border: 1px solid var(--line-strong);
          color: var(--text-dim);
          border-radius: 999px;
          padding: 6px 13px;
          font-size: 12px;
          font-weight: 500;
        }
        .filter-btn.on {
          background: var(--amber);
          border-color: var(--amber);
          color: #201603;
          font-weight: 600;
        }
        .type-chip {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          border-radius: 999px;
          padding: 3px 9px;
          white-space: nowrap;
        }
        .type-recommendation {
          background: rgba(79, 209, 165, 0.15);
          color: var(--mint);
        }
        .type-feature_request {
          background: rgba(232, 163, 61, 0.15);
          color: var(--amber);
        }
        .type-complaint {
          background: rgba(240, 106, 106, 0.15);
          color: var(--coral);
        }
        .type-cap_increase_request {
          background: rgba(154, 163, 184, 0.15);
          color: var(--text-dim);
        }
        .rec-head {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px 10px;
          margin-bottom: 8px;
        }
        .rec-name {
          font-weight: 600;
          font-size: 13px;
          color: var(--text);
        }
        .rec-stars {
          color: var(--amber);
          font-size: 12px;
        }
        .rec-date {
          margin-left: auto;
          color: var(--text-faint);
          font-size: 11px;
        }
        .del {
          background: transparent;
          border: none;
          color: var(--text-faint);
          font-size: 12px;
          padding: 2px 4px;
        }
        .del:hover {
          color: var(--coral);
        }
        .rec-msg {
          color: var(--text-dim);
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        @media (max-width: 480px) {
          .chart-row {
            grid-template-columns: 78px 1fr 46px;
            gap: 6px;
            font-size: 12px;
          }
        }
      `}</style>
    </CollapsibleCard>
  );
}
