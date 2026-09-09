import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string = (body.email || "").trim().toLowerCase();
    const password: string = body.password || "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data: attempt } = await admin
      .from("login_attempts")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (attempt?.locked_until && new Date(attempt.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(attempt.locked_until).getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.` },
        { status: 429 }
      );
    }

    // A normal sign-in, just performed server-side so we can enforce the
    // attempt count around it. Uses the anon key — the same privilege
    // level as the browser would have used directly.
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );
    const { data, error } = await anonClient.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      const newCount = (attempt?.attempt_count ?? 0) + 1;
      const lockedUntil = newCount >= MAX_ATTEMPTS
        ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString()
        : null;

      await admin.from("login_attempts").upsert({
        email,
        attempt_count: newCount,
        last_attempt_at: new Date().toISOString(),
        locked_until: lockedUntil,
      });

      if (lockedUntil) {
        return NextResponse.json(
          { error: `Too many failed attempts. Your sign-in is locked for ${LOCK_MINUTES} minutes.` },
          { status: 429 }
        );
      }
      const remaining = MAX_ATTEMPTS - newCount;
      return NextResponse.json(
        {
          error: `Incorrect email or password. ${remaining} attempt${remaining === 1 ? "" : "s"} left before a temporary lock.`,
        },
        { status: 401 }
      );
    }

    // Success — clear any attempt history and log the login for the
    // admin's (privacy-safe) login-count columns.
    await admin.from("login_attempts").delete().eq("email", email);
    await admin.from("login_events").insert({ user_id: data.session.user.id });

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error." }, { status: 500 });
  }
}
