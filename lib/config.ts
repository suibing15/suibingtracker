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

// ============================================================
// Roles
// ============================================================
export type UserRole = "super_admin" | "admin" | "user";

// Both elevated tiers display as plain "Admin" — the distinction between
// them was internal-only and confusing in practice. Full admin capability
// (manage users, grant features, block/delete accounts) is available to
// either; new admin accounts are created as 'super_admin' going forward.
// 'admin' is kept only for backwards compatibility with any account
// created while the two-tier system briefly existed.
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Admin",
  admin: "Admin",
  user: "User",
};

// The only two roles offered when creating or editing an account.
export const ASSIGNABLE_ROLES: UserRole[] = ["user", "super_admin"];

export function isAdminRole(role: UserRole): boolean {
  return role === "admin" || role === "super_admin";
}

// ============================================================
// Feature flags — the super admin toggles these per user from /admin.
// A feature that's off for a user hides the related UI for them entirely.
// ============================================================
export type FeatureKey =
  | "budgets"
  | "pdf_export"
  | "category_insights"
  | "csv_export"
  | "expense_projector"
  | "income_warning";

export const FEATURE_DEFS: { key: FeatureKey; label: string; description: string }[] = [
  {
    key: "budgets",
    label: "Budgets & spend limits",
    description: "Daily / monthly / per-category limits with over-budget warnings.",
  },
  {
    key: "pdf_export",
    label: "PDF export",
    description: "Stream a PDF report of the currently filtered range straight to the browser.",
  },
  {
    key: "category_insights",
    label: "Category insights",
    description: "The 'What did you spend on' category breakdown card.",
  },
  {
    key: "csv_export",
    label: "CSV export",
    description: "Download the filtered range as a spreadsheet-ready CSV file.",
  },
  {
    key: "expense_projector",
    label: "Expense projector",
    description: "Estimates this month's total from the user's spending pace so far.",
  },
  {
    key: "income_warning",
    label: "Income warning",
    description: "Lets the user set their own monthly income and warns them as spend approaches it.",
  },
];

// New accounts get every feature on by default; the admin can turn any off
// per account afterwards.
export const DEFAULT_FEATURES: Record<FeatureKey, boolean> = {
  budgets: true,
  pdf_export: true,
  category_insights: true,
  csv_export: true,
  expense_projector: true,
  income_warning: true,
};

export function hasFeature(
  features: Record<string, boolean> | null | undefined,
  key: FeatureKey
): boolean {
  if (!features || !(key in features)) return DEFAULT_FEATURES[key];
  return Boolean(features[key]);
}
