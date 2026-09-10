"use client";

import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

export type SectionId =
  | "dashboard"
  | "income"
  | "log"
  | "finance"
  | "reports"
  | "manage_users"
  | "recommendations"
  | "account"
  | "guide";

type NavItem = { id: SectionId; label: string; icon: string; adminOnly?: boolean };

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "◱" },
  { id: "income", label: "Daily Income", icon: "↑" },
  { id: "log", label: "Log a spend", icon: "＋" },
  { id: "finance", label: "Budgets & projections", icon: "◧" },
  { id: "reports", label: "Reports & entries", icon: "▤" },
  { id: "manage_users", label: "Manage users", icon: "◎", adminOnly: true },
  { id: "recommendations", label: "Recommendations", icon: "✦", adminOnly: true },
  { id: "account", label: "My account", icon: "☺" },
  { id: "guide", label: "Guide", icon: "？" },
];

type Props = {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  isAdmin: boolean;
  userEmail: string;
  alerts: string[];
  onOpenBell?: () => void;
  onSignOut: () => void;
};

export default function Sidebar({ active, onSelect, isAdmin, userEmail, alerts, onOpenBell, onSignOut }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function select(id: SectionId) {
    onSelect(id);
    setMobileOpen(false);
  }

  const items = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile top strip: hamburger + brand, sidebar itself is off-canvas */}
      <div className="mobile-strip">
        <button className="hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
        <div className="mobile-brand">
          <span className="mark">◈</span>
          <span>suibingtracker</span>
        </div>
        <div className="mobile-bell">
          <NotificationBell alerts={alerts} onOpen={onOpenBell} />
        </div>
      </div>

      {mobileOpen && <div className="backdrop" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand">
          <span className="mark">◈</span>
          <div>
            <div className="brand-name">suibingtracker</div>
            <div className="brand-tag">Daily expenses, tracked clean.</div>
          </div>
          <button className="close-mobile" onClick={() => setMobileOpen(false)} aria-label="Close menu">✕</button>
        </div>

        <nav className="nav">
          {items.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${active === item.id ? "active" : ""}`}
              onClick={() => select(item.id)}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-line">
            <span className="user-dot" />
            <span className="user-email">{userEmail}</span>
          </div>
          <div className="foot-row">
            <div className="foot-bell-desktop">
              <NotificationBell alerts={alerts} onOpen={onOpenBell} direction="up" />
            </div>
            <ThemeToggle />
            <button className="signout" onClick={onSignOut}>Sign out</button>
          </div>
        </div>
      </aside>

      <style jsx>{`
        .mobile-strip {
          display: none;
        }
        .backdrop {
          display: none;
        }
        .sidebar {
          width: 260px;
          flex-shrink: 0;
          background: linear-gradient(180deg, var(--ink-2), var(--ink));
          border-right: 1px solid var(--line-strong);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 22px 20px;
          border-bottom: 1px solid var(--line);
          position: relative;
        }
        .mark {
          font-size: 24px;
          color: var(--amber);
          line-height: 1;
        }
        .brand-name {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 15px;
        }
        .brand-tag {
          color: var(--text-faint);
          font-size: 11px;
          margin-top: 2px;
        }
        .close-mobile {
          display: none;
        }
        .nav {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: transparent;
          border: none;
          color: var(--text-dim);
          padding: 11px 14px;
          border-radius: var(--radius-sm);
          font-size: 14px;
          text-align: left;
          font-weight: 500;
        }
        .nav-item:hover {
          background: var(--ink-3);
          color: var(--text);
        }
        .nav-item.active {
          background: rgba(232, 163, 61, 0.14);
          color: var(--amber);
          font-weight: 600;
        }
        .icon {
          width: 20px;
          text-align: center;
          font-size: 15px;
          flex-shrink: 0;
        }
        .sidebar-foot {
          border-top: 1px solid var(--line);
          padding: 16px 18px 20px;
        }
        .user-line {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        .user-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--mint);
          flex-shrink: 0;
        }
        .user-email {
          font-size: 12px;
          color: var(--text-faint);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .foot-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .foot-bell-desktop {
          display: block;
        }
        .signout {
          margin-left: auto;
          background: transparent;
          border: 1px solid var(--line-strong);
          color: var(--text-dim);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .signout:hover {
          border-color: var(--coral);
          color: var(--coral);
        }

        @media (max-width: 900px) {
          .mobile-strip {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 14px 16px;
            background: linear-gradient(180deg, var(--ink-2), var(--ink));
            border-bottom: 1px solid var(--line-strong);
            position: sticky;
            top: 0;
            z-index: 30;
          }
          .hamburger {
            background: transparent;
            border: 1px solid var(--line-strong);
            border-radius: var(--radius-sm);
            width: 38px;
            height: 38px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
          }
          .hamburger span {
            width: 16px;
            height: 2px;
            background: var(--text);
            border-radius: 2px;
          }
          .mobile-brand {
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: var(--font-display);
            font-weight: 700;
            font-size: 14px;
          }
          .mobile-brand .mark {
            font-size: 18px;
          }
          .mobile-bell {
            flex-shrink: 0;
          }
          .backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.55);
            z-index: 40;
          }
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.2s ease;
            box-shadow: var(--shadow);
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .close-mobile {
            display: block;
            position: absolute;
            top: 18px;
            right: 16px;
            background: transparent;
            border: none;
            color: var(--text-faint);
            font-size: 16px;
          }
          .foot-bell-desktop {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
