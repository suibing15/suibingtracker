import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Unauthenticated on purpose — this is the one-time bootstrap route. It's
// safe precisely because it refuses to do anything once a super_admin
// already exists (checked twice: before AND after creating the auth user,
// to close the race window as tightly as practical).
export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();

    const { data: alreadyExists, error: checkErr } = await admin.rpc("super_admin_exists");
    if (checkErr) {
      return NextResponse.json({ error: checkErr.message }, { status: 500 });
    }
    if (alreadyExists) {
      return NextResponse.json(
        { error: "A super admin has already been set up for this workspace." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const email: string = (body.email || "").trim();
    const password: string = body.password || "";
    const fullName: string = (body.fullName || "").trim();

    if (!email || password.length < 8) {
      return NextResponse.json(
        { error: "Email and a password of at least 8 characters are required." },
        { status: 400 }
      );
    }

    // email_confirm: true bypasses Supabase's "Confirm email" flow entirely —
    // same as every admin-created account — so this never depends on SMTP
    // being configured.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || null },
    });
    if (createErr || !created.user) {
      return NextResponse.json({ error: createErr?.message ?? "Could not create the account." }, { status: 400 });
    }

    const { data: stillNone } = await admin.rpc("super_admin_exists");
    if (stillNone) {
      return NextResponse.json(
        { error: "A super admin has already been set up for this workspace." },
        { status: 400 }
      );
    }

    // The tracker_on_auth_user_created trigger already inserted a profile
    // row with role 'user'; promote it directly (service role bypasses RLS).
    const { error: roleErr } = await admin
      .from("profiles")
      .update({ role: "super_admin", is_active: true })
      .eq("id", created.user.id);
    if (roleErr) {
      return NextResponse.json({ error: roleErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error." }, { status: 500 });
  }
}
