import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/supabaseAdmin";

function bearerToken(req: NextRequest): string | undefined {
  const header = req.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : undefined;
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { admin, callerId } = await requireAdmin(bearerToken(req));
    if (params.id === callerId) {
      return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
    }
    const { error } = await admin.auth.admin.deleteUser(params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message ?? "Unexpected error." }, { status: 500 });
  }
}

// Admin-triggered password reset — sets a new password directly since this
// app doesn't have outbound email configured for reset links.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { admin } = await requireAdmin(bearerToken(req));
    const body = await req.json();
    const password: string = body.password || "";
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    const { error } = await admin.auth.admin.updateUserById(params.id, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message ?? "Unexpected error." }, { status: 500 });
  }
}
