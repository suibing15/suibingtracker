"use client";

import { useState } from "react";

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export default function CollapsibleCard({ eyebrow, title, subtitle, badge, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card">
      <button className="head" onClick={() => setOpen((v) => !v)}>
        <div className="text">
          <span className="eyebrow">{eyebrow}</span>
          <div className="title-row">
            <h2>{title}</h2>
            {badge && <span className="badge">{badge}</span>}
          </div>
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>
        <span className={`chevron ${open ? "open" : ""}`}>›</span>
      </button>

      {open && <div className="body">{children}</div>}

      <style jsx>{`
        .card {
          background: linear-gradient(180deg, var(--ink-2), var(--ink));
          border: 1px solid var(--line-strong);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .head {
          width: 100%;
          background: transparent;
          border: none;
          color: var(--text);
          padding: 22px 26px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          text-align: left;
          gap: 16px;
        }
        .text {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .eyebrow {
          font-family: var(--font-display);
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--amber);
        }
        .title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px 10px;
        }
        h2 {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 19px;
          overflow-wrap: break-word;
        }
        .badge {
          font-size: 11px;
          color: var(--text-faint);
          border: 1px solid var(--line-strong);
          border-radius: 999px;
          padding: 3px 10px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .subtitle {
          color: var(--text-dim);
          font-size: 13px;
          line-height: 1.5;
          max-width: 520px;
          overflow-wrap: break-word;
        }
        .chevron {
          flex-shrink: 0;
          color: var(--amber);
          font-size: 22px;
          transition: transform 0.15s ease;
          margin-top: 2px;
        }
        .chevron.open {
          transform: rotate(90deg);
        }
        .body {
          padding: 0 26px 26px;
        }
        @media (max-width: 480px) {
          .head {
            padding: 18px 18px;
          }
          .body {
            padding: 0 18px 22px;
          }
          h2 {
            font-size: 17px;
          }
        }
      `}</style>
    </div>
  );
}
