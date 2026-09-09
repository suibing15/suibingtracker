"use client";

import { Expense, Profile } from "@/lib/supabaseClient";
import CollapsibleCard from "./CollapsibleCard";
import BudgetPanel from "./BudgetPanel";
import ExpenseProjector from "./ExpenseProjector";
import IncomeWarning from "./IncomeWarning";
import { hasFeature } from "@/lib/config";

type Props = {
  profile: Profile;
  allExpenses: Expense[];
  onIncomeSaved: () => void;
};

export default function FinanceCard({ profile, allExpenses, onIncomeSaved }: Props) {
  const showBudgets = hasFeature(profile.features, "budgets");
  const showProjector = hasFeature(profile.features, "expense_projector");
  const showIncome = hasFeature(profile.features, "income_warning");

  if (!showBudgets && !showProjector && !showIncome) return null;

  return (
    <CollapsibleCard
      eyebrow="Stay in control"
      title="Budgets, projections & income"
      subtitle="Everything that helps you keep spend in check, in one place."
    >
      <div className="sections">
        {showBudgets && (
          <div className="section">
            <BudgetPanel profile={profile} expenses={allExpenses} bare />
          </div>
        )}
        {showProjector && (
          <div className="section">
            <ExpenseProjector profile={profile} expenses={allExpenses} bare />
          </div>
        )}
        {showIncome && (
          <div className="section">
            <IncomeWarning profile={profile} expenses={allExpenses} onSaved={onIncomeSaved} bare />
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
