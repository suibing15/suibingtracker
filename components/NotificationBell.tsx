"use client";

import { useState } from "react";

type Props = {
  alerts: string[];
  onOpen?: () => void;
};

export default function NotificationBell({ alerts, onOpen }: Props) {
  const [open, setOpen] = useState(false);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) onOpen?.();
  }

  return (
    <div className="bell-wrap">
      <button className="bell-btn" onClick={toggle} aria-label="Notifications">
        <span>🔔</span>
        {alerts.length > 0 && <span className="badge">{alerts.length}</span>}
      </button>

      {open && (
        <>
          <div className="backdrop" onClick={() => setOpen(false)} />
          <div className="dropdown">
            <span className="dd-title">Notifications</span>
            {alerts.length === 0 ? (
              <p className="empty">Nothing needs your attention right now.</p>
            ) : (
              <ul>
                {alerts.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .bell-wrap {
          position: relative;
        }
        .bell-btn {
          position: relative;
          background: transparent;
          border: 1px solid var(--line-strong);
          color: var(--text);
          border-radius: var(--radius-sm);
          width: 38px;
          height: 38px;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bell-btn:hover {
          border-color: var(--amber);
        }
        .badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--coral);
          color: white;
          font-size: 10px;
          font-weight: 700;
          border-radius: 999px;
          min-width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
        }
        .backdrop {
          position: fixed;
          inset: 0;
          z-index: 40;
        }
        .dropdown {
          position: absolute;
          top: 46px;
          right: 0;
          width: 280px;
          background: linear-gradient(180deg, var(--ink-2), var(--ink));
          border: 1px solid var(--line-strong);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 16px;
          z-index: 41;
        }
        .dd-title {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 600;
          display: block;
          margin-bottom: 10px;
        }
        .empty {
          color: var(--text-faint);
          font-size: 12px;
        }
        ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        li {
          font-size: 12px;
          color: var(--text-dim);
          line-height: 1.5;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--line);
        }
        li:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
      `}</style>
    </div>
  );
}
