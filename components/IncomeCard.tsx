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
      title="Income"
      subtitle="Log what you actually receive, and see it against what you expect to earn this month."
    >
      <div className="section">
        <h3>Log income</h3>
        <IncomeForm userId={userId} onSaved={onIncomeLogged} bare />
      </div>

      <div className="section">
        <IncomeEntriesManager entries={allIncome} onChanged={onIncomeLogged} bare />
      </div>

      <div className="section">
        <h3>Expected monthly income vs spend</h3>
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
      `}</style>
    </CollapsibleCard>
  );
}
