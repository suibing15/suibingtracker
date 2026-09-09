"use client";

import { CATEGORIES } from "@/lib/config";

export type Filters = {
  from: string;
  to: string;
  category: string; // "all" or key
  search: string;
};

type Props = {
  filters: Filters;
  onChange: (f: Filters) => void;
  onQuickRange: (days: number | "month" | "all") => void;
  bare?: boolean;
};

export default function FilterBar({ filters, onChange, onQuickRange, bare = false }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <div className={`filters ${bare ? "bare" : ""}`}>
      <div className="quick">
        <button onClick={() => onQuickRange(7)}>7 days</button>
        <button onClick={() => onQuickRange(30)}>30 days</button>
        <button onClick={() => onQuickRange("month")}>This month</button>
        <button onClick={() => onQuickRange("all")}>All time</button>
      </div>

      <div className="controls">
        <label className="field">
          <span>From</span>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => set({ from: e.target.value })}
          />
        </label>
        <label className="field">
          <span>To</span>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => set({ to: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Category</span>
          <select
            value={filters.category}
            onChange={(e) => set({ category: e.target.value })}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field grow">
          <span>Search</span>
          <input
            value={filters.search}
            placeholder="Find by title or note"
            onChange={(e) => set({ search: e.target.value })}
          />
        </label>
      </div>

      <style jsx>{`
        .filters {
          background: rgba(28, 37, 64, 0.6);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 18px;
        }
        .filters.bare {
          background: none;
          border: none;
          padding: 0;
        }
        .quick {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .quick button {
          background: var(--ink-3);
          color: var(--text-dim);
          border: 1px solid var(--line-strong);
          border-radius: 999px;
          padding: 7px 16px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s;
        }
        .quick button:hover {
          color: var(--text);
          border-color: var(--amber);
        }
        .controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field.grow {
          flex: 1;
          min-width: 180px;
        }
        .field span {
          font-size: 11px;
          color: var(--text-faint);
          letter-spacing: 0.04em;
        }
        input,
        select {
          background: var(--ink);
          border: 1px solid var(--line-strong);
          border-radius: var(--radius-sm);
          color: var(--text);
          padding: 10px 12px;
          font-size: 14px;
        }
        input:focus,
        select:focus {
          outline: none;
          border-color: var(--amber);
        }
        @media (max-width: 560px) {
          .field {
            flex: 1;
            min-width: 140px;
          }
        }
      `}</style>
    </div>
  );
}
