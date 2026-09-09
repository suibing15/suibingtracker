"use client";

import { Expense, Profile } from "@/lib/supabaseClient";
import CollapsibleCard from "./CollapsibleCard";
import BudgetPanel from "./BudgetPanel";
import ExpenseProjector from "./ExpenseProjector";
import SavingsGoalsManager from "./SavingsGoalsManager";
import { hasFeature } from "@/lib/config";

type Props = {
  profile: Profile;
  allExpenses: Expense[];
  onProfileChanged: () => void;
};

export default function FinanceCard({ profile, allExpenses, onProfileChanged }: Props) {
  const showBudgets = hasFeature(profile.features, "budgets");
  const showProjector = hasFeature(profile.features, "expense_projector");
  const showGoals = hasFeature(profile.features, "savings_goals");

  if (!showBudgets && !showProjector && !showGoals) return null;

  return (
    <CollapsibleCard
      eyebrow="Stay in control"
      title="Budgets, projections & goals"
      subtitle="Set your limits, see where this month is headed, and save toward what matters."
    >
      <div className="sections">
        {showBudgets && (
          <div className="section">
            <BudgetPanel profile={profile} expenses={allExpenses} onProfileChanged={onProfileChanged} bare />
          </div>
        )}
        {showProjector && (
          <div className="section">
            <ExpenseProjector profile={profile} expenses={allExpenses} bare />
          </div>
        )}
        {showGoals && (
          <div className="section">
            <SavingsGoalsManager userId={profile.id} />
          </div>
        )}
      </div>

      <style jsx>{`
        .sections {
          display: flex;
          flex-direction: column;
        }
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
      `}</style>
    </CollapsibleCard>
  );
}
