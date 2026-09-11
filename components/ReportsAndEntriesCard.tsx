"use client";

import { Expense } from "@/lib/supabaseClient";
import CollapsibleCard from "./CollapsibleCard";
import ReportsBar from "./ReportsBar";
import EntriesManager from "./EntriesManager";
import SavingsHistoryManager from "./SavingsHistoryManager";

type Props = {
  expenses: Expense[];
  rangeLabel: string;
  pdfEnabled: boolean;
  csvEnabled: boolean;
  onChanged: () => void;
};

export default function ReportsAndEntriesCard({ expenses, rangeLabel, pdfEnabled, csvEnabled, onChanged }: Props) {
  const showReports = pdfEnabled || csvEnabled;

  return (
    <CollapsibleCard
      eyebrow="Your data"
      title="Reports & entries"
      subtitle="Export this range, fix a mistake in an individual entry, or check your savings history."
      badge={`${expenses.length} in range`}
      defaultOpen={false}
    >
      {showReports && (
        <div className="section">
          <ReportsBar expenses={expenses} rangeLabel={rangeLabel} pdfEnabled={pdfEnabled} csvEnabled={csvEnabled} bare />
        </div>
      )}
      <div className="section">
        <EntriesManager expenses={expenses} onChanged={onChanged} bare />
      </div>
      <div className="section-last">
        <SavingsHistoryManager />
      </div>

      <style jsx>{`
        .section {
          padding-bottom: 22px;
          margin-bottom: 22px;
          border-bottom: 1px solid var(--line);
        }
        .section-last {
          margin-top: 4px;
        }
      `}</style>
    </CollapsibleCard>
  );
}
