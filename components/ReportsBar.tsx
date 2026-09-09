"use client";

import { Expense } from "@/lib/supabaseClient";
import { categoryByKey, formatDate, CURRENCY } from "@/lib/config";

type Props = {
  expenses: Expense[];
  rangeLabel: string;
  pdfEnabled: boolean;
  csvEnabled: boolean;
  bare?: boolean;
};

export default function ReportsBar({ expenses, rangeLabel, pdfEnabled, csvEnabled, bare = false }: Props) {
  if (!pdfEnabled && !csvEnabled) return null;

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  async function streamPdf() {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const navy: [number, number, number] = [20, 27, 46];
    const amber: [number, number, number] = [232, 163, 61];
    const lightLine: [number, number, number] = [222, 214, 196];

    // A thin border frame around the whole page — drawn once here, then
    // reapplied per-page in the autoTable footer hook below (autoTable adds
    // new pages itself when the table overflows one page).
    function drawPageFrame() {
      doc.setDrawColor(...lightLine);
      doc.setLineWidth(0.4);
      doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);
    }
    drawPageFrame();

    doc.setFillColor(...navy);
    doc.rect(margin, margin, pageWidth - margin * 2, 26, "F");
    doc.setTextColor(245, 241, 232);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text("suibingtracker", margin + 8, margin + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...amber);
    doc.text("Daily expense report", margin + 8, margin + 19);

    doc.setTextColor(70, 70, 70);
    doc.setFontSize(10);
    doc.text(`Range: ${rangeLabel}`, margin + 8, margin + 36);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`,
      margin + 8,
      margin + 42
    );
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(
      `Total: ${CURRENCY.symbol}${total.toLocaleString(CURRENCY.locale, { minimumFractionDigits: 2 })}`,
      margin + 8,
      margin + 50
    );
    doc.setFont("helvetica", "normal");

    doc.setDrawColor(...lightLine);
    doc.setLineWidth(0.3);
    doc.line(margin + 8, margin + 55, pageWidth - margin - 8, margin + 55);

    autoTable(doc, {
      startY: margin + 62,
      margin: { left: margin + 8, right: margin + 8, bottom: margin + 12 },
      head: [["Date", "Title", "Category", "Paid with", "Amount (NGN)"]],
      body: expenses.map((e) => [
        formatDate(e.spent_on),
        e.title + (e.note ? `  (${e.note})` : ""),
        categoryByKey(e.category).label,
        e.payment_method,
        Number(e.amount).toLocaleString(CURRENCY.locale, { minimumFractionDigits: 2 }),
      ]),
      styles: { fontSize: 9, cellPadding: 3.5, lineColor: lightLine, lineWidth: 0.2 },
      headStyles: { fillColor: amber, textColor: navy, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 245, 238] },
      columnStyles: { 4: { halign: "right" } },
      didDrawPage: () => {
        // autoTable calls this once per page it creates — keep the frame
        // and a page number on every page, not just the first.
        drawPageFrame();
        const pageNum = doc.getNumberOfPages();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(`Page ${pageNum}`, pageWidth - margin - 8, pageHeight - margin - 4, { align: "right" });
        doc.text("suibingtracker · Suibing IT Services", margin + 8, pageHeight - margin - 4);
      },
    });

    // Stream straight to the browser (opens the PDF inline in a new tab)
    // rather than forcing a file download.
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl as unknown as string, "_blank");
  }

  function downloadCsv() {
    const header = ["Date", "Title", "Category", "Paid with", "Amount", "Note"];
    const rows = expenses.map((e) => [
      e.spent_on,
      e.title,
      categoryByKey(e.category).label,
      e.payment_method,
      String(e.amount),
      e.note ?? "",
    ]);
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row) => row.map((v) => escape(String(v))).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suibingtracker_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`reports-bar ${bare ? "bare" : ""}`}>
      <span className="label">Reports for this range</span>
      <div className="btns">
        {pdfEnabled && (
          <button className="btn" onClick={streamPdf} disabled={!expenses.length}>
            View PDF
          </button>
        )}
        {csvEnabled && (
          <button className="btn ghost" onClick={downloadCsv} disabled={!expenses.length}>
            Download CSV
          </button>
        )}
      </div>
      <style jsx>{`
        .reports-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          background: linear-gradient(180deg, var(--ink-2), var(--ink));
          border: 1px solid var(--line-strong);
          border-radius: var(--radius);
          padding: 16px 22px;
          box-shadow: var(--shadow);
        }
        .reports-bar.bare {
          background: none;
          border: none;
          box-shadow: none;
          padding: 0;
        }
        .label {
          font-size: 13px;
          color: var(--text-dim);
          font-weight: 500;
        }
        .btns {
          display: flex;
          gap: 10px;
        }
        .btn {
          background: var(--amber);
          color: #201603;
          border: none;
          border-radius: var(--radius-sm);
          padding: 9px 18px;
          font-weight: 600;
          font-size: 13px;
          font-family: var(--font-display);
        }
        .btn.ghost {
          background: transparent;
          border: 1px solid var(--amber);
          color: var(--text);
        }
        .btn:disabled {
          opacity: 0.4;
        }
      `}</style>
    </div>
  );
}
