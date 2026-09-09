import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/supabaseAdmin";
import { sendPushToUser } from "@/lib/pushServer";

function bearerToken(req: NextRequest): string | undefined {
  const header = req.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : undefined;
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(bearerToken(req));
    const body = await req.json();
    const userId: string = body.userId;
    const title: string = body.title || "suibingtracker";
    const message: string = body.body || "";

    if (!userId || !message.trim()) {
      return NextResponse.json({ error: "userId and body are required." }, { status: 400 });
    }

    await sendPushToUser(userId, { title, body: message });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message ?? "Unexpected error." }, { status: 500 });
  }
}
