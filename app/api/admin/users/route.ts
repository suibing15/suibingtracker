import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/supabaseAdmin";
import { UserRole } from "@/lib/config";

function bearerToken(req: NextRequest): string | undefined {
  const header = req.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const { admin } = await requireAdmin(bearerToken(req));
    const body = await req.json();
    const email: string = (body.email || "").trim();
    const password: string = body.password || "";
    const fullName: string = (body.fullName || "").trim();
    const role: UserRole = body.role === "super_admin" || body.role === "admin" ? body.role : "user";

    if (!email || password.length < 8) {
      return NextResponse.json(
        { error: "Email and a password of at least 8 characters are required." },
        { status: 400 }
      );
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || null },
    });
    if (createErr || !created.user) {
      return NextResponse.json({ error: createErr?.message ?? "Could not create user." }, { status: 400 });
    }

    // The on_auth_user_created trigger already inserted a profile row with
    // role 'user'; bump it up if a higher role was requested.
    if (role !== "user") {
      const { error: roleErr } = await admin
        .from("profiles")
        .update({ role })
        .eq("id", created.user.id);
      if (roleErr) {
        return NextResponse.json({ error: roleErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({ id: created.user.id, email, role });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message ?? "Unexpected error." }, { status: 500 });
  }
}
