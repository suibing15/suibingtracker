"use client";

import { Expense } from "@/lib/supabaseClient";
import CollapsibleCard from "./CollapsibleCard";
import ReportsBar from "./ReportsBar";
import EntriesManager from "./EntriesManager";

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
      subtitle="Export this range, or fix a mistake in an individual entry."
      badge={`${expenses.length} in range`}
      defaultOpen={false}
    >
      {showReports && (
        <div className="section">
          <ReportsBar expenses={expenses} rangeLabel={rangeLabel} pdfEnabled={pdfEnabled} csvEnabled={csvEnabled} bare />
        </div>
      )}
      <div className={showReports ? "section" : ""}>
        <EntriesManager expenses={expenses} onChanged={onChanged} bare />
      </div>

      <style jsx>{`
        .section {
          padding-bottom: 22px;
          margin-bottom: 22px;
          border-bottom: 1px solid var(--line);
        }
      `}</style>
    </CollapsibleCard>
  );
}
