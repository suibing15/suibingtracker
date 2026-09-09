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
  created_at: string;
  updated_at: string;
};

// Shape returned by tracker.admin_user_overview() — aggregate numbers only,
// never a raw expense row. See supabase/schema.sql.
export type AdminOverviewRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  spend_today: number;
  spend_this_month: number;
  entries_this_month: number;
  last_entry_at: string | null;
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
