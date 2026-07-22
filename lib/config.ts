// Central place to customise the tracker. Edit these to reshape the app
// without touching component code.

export const CURRENCY = {
  code: "NGN",
  symbol: "₦",
  locale: "en-NG",
};

export type CategoryDef = { key: string; label: string; color: string };

// Categories drive the form dropdown, the filter chips and the dashboard
// breakdown. Add, remove or recolour freely.
export const CATEGORIES: CategoryDef[] = [
  { key: "food", label: "Food & Drink", color: "#E8A33D" },
  { key: "transport", label: "Transport", color: "#4FD1A5" },
  { key: "utilities", label: "Utilities", color: "#6C8CFF" },
  { key: "airtime", label: "Airtime & Data", color: "#C77DFF" },
  { key: "shopping", label: "Shopping", color: "#F06A6A" },
  { key: "health", label: "Health", color: "#5FD0E0" },
  { key: "family", label: "Family & Gifts", color: "#F58AB0" },
  { key: "other", label: "Other", color: "#9AA3B8" },
];

export const PAYMENT_METHODS = [
  "Cash",
  "Bank transfer",
  "Card",
  "USSD",
  "Mobile wallet",
];

export const categoryByKey = (key: string): CategoryDef =>
  CATEGORIES.find((c) => c.key === key) ??
  { key, label: key, color: "#9AA3B8" };

export function formatMoney(n: number): string {
  return (
    CURRENCY.symbol +
    Number(n || 0).toLocaleString(CURRENCY.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatDate(iso: string): string {
  // DD MMM YYYY
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
