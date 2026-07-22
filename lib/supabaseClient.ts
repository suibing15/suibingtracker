import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create the client only when env vars exist. During build/prerender (or before
// the keys are set) createClient would throw "supabaseUrl is required", so we
// guard it and expose a typed handle. The UI checks isConfigured before use.
let client: SupabaseClient | null = null;
if (isConfigured) {
  client = createClient(supabaseUrl as string, supabaseAnonKey as string, {
    auth: { persistSession: false },
  });
}

export const supabase = client as SupabaseClient;

export type Expense = {
  id: string;
  spent_on: string; // date (YYYY-MM-DD)
  title: string;
  category: string;
  payment_method: string;
  amount: number; // NGN
  note: string | null;
  created_at: string;
};
