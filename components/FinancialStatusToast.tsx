"use client";

import { useEffect, useState } from "react";
import { Expense, IncomeEntry, Profile } from "@/lib/supabaseClient";
import { formatMoney } from "@/lib/config";

type Props = { profile: Profile; allExpenses: Expense[]; allIncome: IncomeEntry[] };

type ToneInfo = {
  kind: "over" | "good" | "stable";
  icon: string;
  title: string;
  message: string;
  accent: string;
  glow: string;
};

const STATE_KEY = "suibingtracker-status-toast-state";
const AUTO_DISMISS_MS = 8000;

// How often this is allowed to interrupt: routine re-shows (situation is
// the same or better than last time) are spaced out and capped per day, so
// it stays a periodic nudge rather than a nag. A genuine escalation — the
// situation getting WORSE than what was last shown today — always breaks
// through immediately regardless of the cap or the gap, since that's
// exactly the moment the reminder exists for.
const MAX_ROUTINE_SHOWS_PER_DAY = 3;
const MIN_GAP_BETWEEN_ROUTINE_SHOWS_MS = 3 * 60 * 60 * 1000; // 3 hours
const MIN_GAP_FOR_ESCALATION_MS = 5 * 60 * 1000; // still avoid rapid double-fires from re-renders

const TONE_SEVERITY: Record<ToneInfo["kind"], number> = { good: 1, stable: 2, over: 3 };

type StoredState = { dateKey: string; lastShownAt: number; lastTone: ToneInfo["kind"] | null; count: number };

function loadState(): StoredState {
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to a fresh state
  }
  return { dateKey: "", lastShownAt: 0, lastTone: null, count: 0 };
}

function saveState(state: StoredState) {
  window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export default function FinancialStatusToast({ profile, allExpenses, allIncome }: Props) {
  const [tone, setTone] = useState<ToneInfo | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const todayKey = now.toISOString().slice(0, 10);

    const spendThisMonth = allExpenses
      .filter((e) => e.spent_on >= monthStart)
      .reduce((s, e) => s + Number(e.amount), 0);
    const loggedIncomeThisMonth = allIncome
      .filter((i) => i.received_on >= monthStart)
      .reduce((s, i) => s + Number(i.amount), 0);

    // Prefer the fixed figure the user set deliberately; fall back to
    // whatever's actually been logged this month if they haven't set one.
    const incomeBasis = profile.monthly_income && profile.monthly_income > 0
      ? profile.monthly_income
      : loggedIncomeThisMonth;

    if (!incomeBasis || incomeBasis <= 0 || spendThisMonth <= 0) return; // nothing meaningful to compare yet

    const ratio = spendThisMonth / incomeBasis;
    let info: ToneInfo;

    if (ratio >= 1) {
      info = {
        kind: "over",
        icon: "⚠️",
        title: "You're spending more than you're earning",
        message: `This month's expenses (${formatMoney(spendThisMonth)}) have passed your income (${formatMoney(incomeBasis)}). Worth a closer look before it goes further.`,
        accent: "#F06A6A",
        glow: "rgba(240, 106, 106, 0.35)",
      };
    } else if (ratio < 0.5) {
      info = {
        kind: "good",
        icon: "🎉",
        title: "Great financial management!",
        message: `You've only used ${Math.round(ratio * 100)}% of your income this month. Whatever you're doing, keep it up.`,
        accent: "#4FD1A5",
        glow: "rgba(79, 209, 165, 0.35)",
      };
    } else {
      info = {
        kind: "stable",
        icon: "⚖️",
        title: "A healthy balance this month",
        message: `Your expenses are tracking at ${Math.round(ratio * 100)}% of your income — stable, and comfortably within range.`,
        accent: "#E8A33D",
        glow: "rgba(232, 163, 61, 0.35)",
      };
    }

    const state = loadState();
    const isNewDay = state.dateKey !== todayKey;
    const effective = isNewDay ? { dateKey: todayKey, lastShownAt: 0, lastTone: null, count: 0 } : state;

    const msSinceLastShow = now.getTime() - effective.lastShownAt;
    const isEscalation = effective.lastTone !== null && TONE_SEVERITY[info.kind] > TONE_SEVERITY[effective.lastTone];

    let shouldShow = false;
    if (isEscalation) {
      shouldShow = msSinceLastShow >= MIN_GAP_FOR_ESCALATION_MS;
    } else if (effective.count < MAX_ROUTINE_SHOWS_PER_DAY) {
      shouldShow = effective.lastShownAt === 0 || msSinceLastShow >= MIN_GAP_BETWEEN_ROUTINE_SHOWS_MS;
    }

    if (!shouldShow) return;

    setTone(info);
    saveState({
      dateKey: todayKey,
      lastShownAt: now.getTime(),
      lastTone: info.kind,
      count: effective.count + 1,
    });

    const timer = setTimeout(() => dismiss(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id, profile.monthly_income, allExpenses.length, allIncome.length]);

  function dismiss() {
    setClosing(true);
    setTimeout(() => setTone(null), 250);
  }

  if (!tone) return null;

  return (
    <div className={`toast-wrap ${closing ? "closing" : ""}`}>
      <div className="toast" style={{ borderColor: tone.accent, boxShadow: `0 20px 50px -12px ${tone.glow}, var(--shadow)` }}>
        <span className="toast-icon" style={{ background: tone.glow }}>{tone.icon}</span>
        <div className="toast-body">
          <span className="toast-title" style={{ color: tone.accent }}>{tone.title}</span>
          <p className="toast-msg">{tone.message}</p>
        </div>
        <button className="toast-close" onClick={dismiss} aria-label="Dismiss">✕</button>
        <div className="toast-timer" style={{ background: tone.accent }} />
      </div>

      <style jsx>{`
        .toast-wrap {
          position: fixed;
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 70;
          width: min(92vw, 440px);
          animation: toast-in 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .toast-wrap.closing {
          animation: toast-out 0.25s ease forwards;
        }
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translate(-50%, -16px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @keyframes toast-out {
          from {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          to {
            opacity: 0;
            transform: translate(-50%, -12px);
          }
        }
        .toast {
          position: relative;
          background: linear-gradient(180deg, var(--ink-2), var(--ink));
          border: 1.5px solid;
          border-radius: var(--radius);
          padding: 16px 40px 18px 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          overflow: hidden;
        }
        .toast-icon {
          font-size: 22px;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .toast-body {
          min-width: 0;
        }
        .toast-title {
          display: block;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .toast-msg {
          color: var(--text-dim);
          font-size: 12.5px;
          line-height: 1.55;
        }
        .toast-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          color: var(--text-faint);
          font-size: 12px;
          padding: 4px;
        }
        .toast-close:hover {
          color: var(--text);
        }
        .toast-timer {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          width: 100%;
          opacity: 0.6;
          animation: toast-shrink 8s linear forwards;
          transform-origin: left;
        }
        @keyframes toast-shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
        @media (max-width: 480px) {
          .toast-wrap {
            top: 12px;
            width: 94vw;
          }
          .toast {
            padding: 14px 36px 16px 14px;
          }
        }
      `}</style>
    </div>
  );
}
