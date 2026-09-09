"use client";

import { Expense, IncomeEntry, Profile } from "@/lib/supabaseClient";
import CollapsibleCard from "./CollapsibleCard";
import BudgetPanel from "./BudgetPanel";
import ExpenseProjector from "./ExpenseProjector";
import IncomeProjector from "./IncomeProjector";
import SavingsGoalsManager from "./SavingsGoalsManager";
import { hasFeature } from "@/lib/config";

type Props = {
  profile: Profile;
  allExpenses: Expense[];
  allIncome: IncomeEntry[];
  onProfileChanged: () => void;
};

export default function FinanceCard({ profile, allExpenses, allIncome, onProfileChanged }: Props) {
  const showBudgets = hasFeature(profile.features, "budgets");
  const showProjector = hasFeature(profile.features, "expense_projector");
  const showIncomeProjector = hasFeature(profile.features, "income_warning");
  const showGoals = hasFeature(profile.features, "savings_goals");

  if (!showBudgets && !showProjector && !showIncomeProjector && !showGoals) return null;

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
        {showIncomeProjector && (
          <div className="section">
            <IncomeProjector expenses={allExpenses} income={allIncome} bare />
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
