import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// This file must NEVER be imported from a "use client" component — the
// `server-only` import above makes Next.js fail the build if that happens.
// It uses the Supabase SERVICE ROLE key, which bypasses Row Level Security
// entirely, so it may only run inside Route Handlers (app/api/**/route.ts).

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isAdminConfigured = Boolean(supabaseUrl && serviceRoleKey);

let adminClient: SupabaseClient<any, any, any> | null = null;
if (isAdminConfigured) {
  adminClient = createClient(supabaseUrl as string, serviceRoleKey as string, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Match the anon client: this app's tables live in the "tracker"
    // schema, not "public". Doesn't affect .auth.admin.* calls (those
    // always operate on the auth schema regardless of this setting).
    db: { schema: "tracker" },
  });
}

// Throws with a clear message rather than a cryptic null-reference if the
// SUPABASE_SERVICE_ROLE_KEY env var hasn't been added to the deployment yet.
export function getSupabaseAdmin(): SupabaseClient<any, any, any> {
  if (!adminClient) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it in Vercel → Project → " +
        "Settings → Environment Variables (Project Settings → API → service_role " +
        "in Supabase). Keep it secret — never expose it with the NEXT_PUBLIC_ prefix."
    );
  }
  return adminClient;
}

// Verifies a caller's access token belongs to an active admin-tier account
// ('admin' or 'super_admin' — both get full capability, see lib/config.ts
// isAdminRole). Every admin API route calls this first before touching
// auth.users.
export async function requireAdmin(accessToken: string | undefined) {
  const admin = getSupabaseAdmin();
  if (!accessToken) {
    throw new AuthError("Missing access token.");
  }
  const { data: userData, error: userErr } = await admin.auth.getUser(accessToken);
  if (userErr || !userData?.user) {
    throw new AuthError("Invalid or expired session.");
  }
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", userData.user.id)
    .single();
  if (profileErr || !profile) {
    throw new AuthError("No profile found for this account.");
  }
  if ((profile.role !== "super_admin" && profile.role !== "admin") || !profile.is_active) {
    throw new AuthError("Admin access required.");
  }
  return { admin, callerId: userData.user.id as string };
}

export class AuthError extends Error {}
