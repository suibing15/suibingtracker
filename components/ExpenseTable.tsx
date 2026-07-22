"use client";

import { Expense, supabase } from "@/lib/supabaseClient";
import { categoryByKey, formatMoney, formatDate, CURRENCY } from "@/lib/config";

type Props = {
  expenses: Expense[];
  rangeLabel: string;
  onChanged: () => void;
};

export default function ExpenseTable({ expenses, rangeLabel, onChanged }: Props) {
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  async function remove(id: string) {
    if (!confirm("Delete this expense? This cannot be undone.")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      alert("Could not delete: " + error.message);
      return;
    }
    onChanged();
  }

  async function exportPdf() {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    const navy: [number, number, number] = [20, 27, 46];
    const amber: [number, number, number] = [232, 163, 61];

    doc.setFillColor(...navy);
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(245, 241, 232);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("suibingtracker", 14, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(232, 163, 61);
    doc.text("Daily expense report", 14, 22);

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.text(`Range: ${rangeLabel}`, 14, 38);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`,
      14,
      44
    );
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ${CURRENCY.symbol}${total.toLocaleString(CURRENCY.locale, {
      minimumFractionDigits: 2,
    })}`, 14, 50);
    doc.setFont("helvetica", "normal");

    autoTable(doc, {
      startY: 56,
      head: [["Date", "Title", "Category", "Paid with", "Amount (NGN)"]],
      body: expenses.map((e) => [
        formatDate(e.spent_on),
        e.title + (e.note ? `  (${e.note})` : ""),
        categoryByKey(e.category).label,
        e.payment_method,
        Number(e.amount).toLocaleString(CURRENCY.locale, {
          minimumFractionDigits: 2,
        }),
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: amber, textColor: navy, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 241, 232] },
      columnStyles: { 4: { halign: "right" } },
    });

    doc.save(`suibingtracker_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div className="table-card">
      <div className="table-head">
        <div>
          <span className="eyebrow">Entries</span>
          <h2>Your expenses</h2>
        </div>
        <button className="pdf-btn" onClick={exportPdf} disabled={!expenses.length}>
          Export PDF
        </button>
      </div>

      {expenses.length === 0 ? (
        <p className="empty">Nothing matches these filters. Adjust the range, or log your first spend above.</p>
      ) : (
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th>Paid with</th>
                <th className="right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => {
                const cat = categoryByKey(e.category);
                return (
                  <tr key={e.id}>
                    <td className="tab-nums dim">{formatDate(e.spent_on)}</td>
                    <td>
                      <div className="title">{e.title}</div>
                      {e.note && <div className="note">{e.note}</div>}
                    </td>
                    <td>
                      <span className="chip" style={{ borderColor: cat.color }}>
                        <span className="dot" style={{ background: cat.color }} />
                        {cat.label}
                      </span>
                    </td>
                    <td className="dim">{e.payment_method}</td>
                    <td className="right tab-nums amount">{formatMoney(e.amount)}</td>
                    <td className="right">
                      <button className="del" onClick={() => remove(e.id)} aria-label="Delete">
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="dim">Total ({expenses.length})</td>
                <td className="right tab-nums total">{formatMoney(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <style jsx>{`
        .table-card {
          background: linear-gradient(180deg, var(--ink-2), var(--ink));
          border: 1px solid var(--line-strong);
          border-radius: var(--radius);
          padding: 26px;
          box-shadow: var(--shadow);
        }
        .table-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 20px;
        }
        .eyebrow {
          font-family: var(--font-display);
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--amber);
        }
        .table-head h2 {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 22px;
          margin-top: 6px;
        }
        .pdf-btn {
          background: transparent;
          color: var(--text);
          border: 1px solid var(--amber);
          border-radius: var(--radius-sm);
          padding: 10px 20px;
          font-weight: 600;
          font-size: 14px;
          font-family: var(--font-display);
          transition: all 0.15s;
        }
        .pdf-btn:hover:not(:disabled) {
          background: var(--amber);
          color: #201603;
        }
        .pdf-btn:disabled {
          opacity: 0.4;
          cursor: default;
        }
        .scroll {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        th {
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-faint);
          font-weight: 600;
          padding: 0 14px 12px;
          border-bottom: 1px solid var(--line-strong);
        }
        td {
          padding: 14px;
          border-bottom: 1px solid var(--line);
          vertical-align: top;
        }
        .right {
          text-align: right;
        }
        .dim {
          color: var(--text-dim);
        }
        .title {
          color: var(--text);
          font-weight: 500;
        }
        .note {
          color: var(--text-faint);
          font-size: 12px;
          margin-top: 3px;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid;
          border-radius: 999px;
          padding: 4px 11px;
          font-size: 12px;
          color: var(--text);
          white-space: nowrap;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .amount {
          color: var(--text);
          font-weight: 500;
        }
        .del {
          background: transparent;
          border: none;
          color: var(--text-faint);
          font-size: 13px;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .del:hover {
          color: var(--coral);
          background: rgba(240, 106, 106, 0.12);
        }
        tfoot td {
          border-bottom: none;
          padding-top: 16px;
          font-weight: 600;
        }
        .total {
          color: var(--amber);
          font-family: var(--font-display);
          font-size: 16px;
        }
        .empty {
          color: var(--text-faint);
          font-size: 14px;
          padding: 20px 0;
        }
      `}</style>
    </div>
  );
}
