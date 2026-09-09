import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendPushToUser } from "@/lib/pushServer";

// Protected by a shared secret rather than a user session — this is called
// by Vercel Cron, not a signed-in person. See vercel.json for the schedule.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  let notified = 0;

  // 1. Recurring bills due today or overdue.
  const { data: dueBills } = await admin
    .from("recurring_bills")
    .select("user_id, title, amount, next_due_date")
    .eq("is_active", true)
    .lte("next_due_date", today);

  const billsByUser = new Map<string, { title: string; amount: number }[]>();
  for (const b of dueBills ?? []) {
    const list = billsByUser.get(b.user_id) ?? [];
    list.push({ title: b.title, amount: Number(b.amount) });
    billsByUser.set(b.user_id, list);
  }
  for (const [userId, bills] of billsByUser) {
    const summary = bills.length === 1 ? bills[0].title : `${bills.length} bills`;
    await sendPushToUser(userId, {
      title: "Bill due",
      body: `${summary} due — open suibingtracker to log ${bills.length === 1 ? "it" : "them"}.`,
    });
    notified++;
  }

  // 2. Over daily/monthly cap.
  const monthStart = today.slice(0, 8) + "01";
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, daily_budget, monthly_budget")
    .eq("is_active", true)
    .or("daily_budget.not.is.null,monthly_budget.not.is.null");

  for (const p of profiles ?? []) {
    let overDaily = false;
    let overMonthly = false;

    if (p.daily_budget != null) {
      const { data: todayRows } = await admin
        .from("expenses")
        .select("amount")
        .eq("user_id", p.id)
        .eq("spent_on", today);
      const spentToday = (todayRows ?? []).reduce((s, r) => s + Number(r.amount), 0);
      overDaily = spentToday > p.daily_budget;
    }
    if (p.monthly_budget != null) {
      const { data: monthRows } = await admin
        .from("expenses")
        .select("amount")
        .eq("user_id", p.id)
        .gte("spent_on", monthStart);
      const spentMonth = (monthRows ?? []).reduce((s, r) => s + Number(r.amount), 0);
      overMonthly = spentMonth > p.monthly_budget;
    }

    if (overDaily || overMonthly) {
      const parts = [overDaily && "today's", overMonthly && "this month's"].filter(Boolean).join(" and ");
      await sendPushToUser(p.id, {
        title: "Over your spending cap",
        body: `You're over ${parts} cap. Open suibingtracker for the details.`,
      });
      notified++;
    }
  }

  return NextResponse.json({ ok: true, notified });
}
