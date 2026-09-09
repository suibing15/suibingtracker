import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public on purpose — this is the "sign up free" path. Every account it
// creates lands as role 'user' with default features (see
// tracker.handle_new_user / lib/config.ts DEFAULT_FEATURES); an admin can
// tighten or expand what any account sees afterwards from /admin.
//
// Known limitation: there's no rate limiting on this route yet. It's fine
// for a soft launch, but before wide public promotion, put a real rate
// limiter in front of it (e.g. Upstash Redis, or Vercel's bot/attack
// protection) — an in-memory counter here wouldn't survive serverless cold
// starts and would give false confidence.
export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const email: string = (body.email || "").trim().toLowerCase();
    const password: string = body.password || "";
    const fullName: string = (body.fullName || "").trim();

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || null },
    });
    if (error || !created.user) {
      return NextResponse.json({ error: error?.message ?? "Could not create your account." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error." }, { status: 500 });
  }
}
