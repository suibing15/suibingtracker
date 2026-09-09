import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { FeatureKey, UserRole } from "./config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create the client only when env vars exist. During build/prerender (or before
// the keys are set) createClient would throw "supabaseUrl is required", so we
// guard it and expose a typed handle. The UI checks isConfigured before use.
// persistSession is on now that there are real accounts to stay signed into.
// Typed loosely across the schema generic since this client is pinned to
// the "tracker" schema (not supabase-js's default "public") — see db.schema
// below.
let client: SupabaseClient<any, any, any> | null = null;
if (isConfigured) {
  client = createClient(supabaseUrl as string, supabaseAnonKey as string, {
    auth: { persistSession: true, autoRefreshToken: true },
    // This app's tables live in their own "tracker" schema, not "public" —
    // see supabase/schema.sql. "tracker" must also be added to
    // Project Settings → API → Exposed schemas in the Supabase dashboard.
    db: { schema: "tracker" },
  });
}

export const supabase = client as SupabaseClient<any, any, any>;

export type Expense = {
  id: string;
  user_id: string;
  spent_on: string; // date (YYYY-MM-DD)
  title: string;
  category: string;
  payment_method: string;
  amount: number; // NGN
  note: string | null;
  created_at: string;
};

export type IncomeEntry = {
  id: string;
  user_id: string;
  received_on: string; // date (YYYY-MM-DD)
  source: string;
  amount: number;
  note: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  features: Partial<Record<FeatureKey, boolean>>;
  daily_budget: number | null;
  monthly_budget: number | null;
  monthly_income: number | null;
  admin_notice: string | null;
  admin_notice_set_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RecommendationType = "recommendation" | "feature_request" | "complaint" | "cap_increase_request";

export type Recommendation = {
  id: string;
  user_id: string;
  message: string;
  rating: number | null;
  type: RecommendationType;
  created_at: string;
};

// Shape returned by tracker.admin_user_overview() — login activity only,
// never spend. See supabase/schema.sql.
export type AdminOverviewRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  logins_today: number;
  logins_this_month: number;
  last_login_at: string | null;
};

// Shape returned by tracker.admin_spend_totals() — one row, platform-wide,
// no per-user breakdown. This is the only place spend/income numbers reach
// admin.
export type AdminSpendTotals = {
  spend_today: number;
  spend_this_month: number;
  income_today: number;
  income_this_month: number;
  active_users: number;
  total_users: number;
};

export type Budget = {
  id: string;
  user_id: string;
  category: string | null; // null = overall
  period: "daily" | "monthly";
  limit_amount: number;
  created_at: string;
  updated_at: string;
};
