"use client";

import { Expense, IncomeEntry, Profile } from "@/lib/supabaseClient";
import CollapsibleCard from "./CollapsibleCard";
import IncomeForm from "./IncomeForm";
import IncomeWarning from "./IncomeWarning";
import IncomeEntriesManager from "./IncomeEntriesManager";

type Props = {
  profile: Profile;
  userId: string;
  allIncome: IncomeEntry[];
  allExpenses: Expense[];
  onIncomeLogged: () => void;
  onExpectedIncomeSaved: () => void;
};

export default function IncomeCard({
  profile,
  userId,
  allIncome,
  allExpenses,
  onIncomeLogged,
  onExpectedIncomeSaved,
}: Props) {
  return (
    <CollapsibleCard
      eyebrow="Money coming in"
      title="Daily Income"
      subtitle="Log what you actually receive day to day, and separately, see it against a fixed monthly figure you expect to earn."
    >
      <div className="section">
        <div className="distinguish">
          <strong>Two different things on this card:</strong> "Daily Income" below is every payment you log as it
          comes in, dated and added up over time. "Fixed Monthly Income" further down is a single number you set
          once — what you expect to earn this month — used only to compare against your spend.
        </div>
      </div>

      <div className="section">
        <h3>Log income</h3>
        <IncomeForm userId={userId} onSaved={onIncomeLogged} bare />
      </div>

      <div className="section">
        <IncomeEntriesManager entries={allIncome} onChanged={onIncomeLogged} bare />
      </div>

      <div className="section">
        <h3>Fixed Monthly Income vs Expenses</h3>
        <p className="hint">
          A separate figure from what you log above — set what you expect to earn this month, and see how your
          spend compares.
        </p>
        <IncomeWarning profile={profile} expenses={allExpenses} onSaved={onExpectedIncomeSaved} bare />
      </div>

      <style jsx>{`
        .section {
          padding: 22px 0;
        }
        .section:first-child {
          padding-top: 0;
        }
        .section:last-child {
          padding-bottom: 0;
        }
        .section + .section {
          border-top: 1px solid var(--line);
        }
        h3 {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .hint {
          color: var(--text-faint);
          font-size: 12px;
          line-height: 1.6;
          margin: -6px 0 14px;
        }
        .distinguish {
          background: rgba(232, 163, 61, 0.08);
          border: 1px solid rgba(232, 163, 61, 0.3);
          border-radius: var(--radius-sm);
          padding: 12px 16px;
          font-size: 12.5px;
          color: var(--text-dim);
          line-height: 1.6;
        }
        .distinguish strong {
          color: var(--amber-soft);
        }
      `}</style>
    </CollapsibleCard>
  );
}
