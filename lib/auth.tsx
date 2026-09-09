"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isConfigured, Profile } from "./supabaseClient";

type AuthState = {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  // Whether ANY super admin exists yet in this workspace. Drives whether
  // /setup is reachable or bounces to /login.
  superAdminExists: boolean | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [superAdminExists, setSuperAdminExists] = useState<boolean | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile((data as Profile) ?? null);
  }, []);

  const checkSuperAdminExists = useCallback(async () => {
    const { data, error } = await supabase.rpc("super_admin_exists");
    if (!error) setSuperAdminExists(Boolean(data));
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    let active = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      await checkSuperAdminExists();
      setLoading(false);
    }
    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      await checkSuperAdminExists();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile, checkSuperAdminExists]);

  const signIn = useCallback(async (email: string, password: string) => {
    // Routed through /api/login (not supabase.auth.signInWithPassword
    // directly) so failed attempts are rate-limited server-side and
    // successful ones are logged for the admin's login-count view.
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: body.error ?? "Could not sign in." };
    }
    const { error } = await supabase.auth.setSession({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value = useMemo<AuthState>(
    () => ({ loading, session, profile, superAdminExists, signIn, signOut, refreshProfile }),
    [loading, session, profile, superAdminExists, signIn, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// Small helper for calling the /api/admin/* route handlers with the
// current user's access token attached.
export async function callAdminApi(
  path: string,
  init: RequestInit = {}
): Promise<{ ok: boolean; data: any }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      Authorization: `Bearer ${token ?? ""}`,
    },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, data: body };
}
