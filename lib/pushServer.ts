import "server-only";
import webpush from "web-push";
import { getSupabaseAdmin } from "./supabaseAdmin";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:suibing15@gmail.com";

export const isPushConfigured = Boolean(publicKey && privateKey);

if (isPushConfigured) {
  webpush.setVapidDetails(subject, publicKey as string, privateKey as string);
}

// Sends a push to every subscription a user has, pruning any that have
// expired/unsubscribed (410/404 responses) as it goes. Never throws — a
// push failure shouldn't break whatever admin/cron action triggered it.
export async function sendPushToUser(userId: string, payload: { title: string; body: string }) {
  if (!isPushConfigured) return;
  const admin = getSupabaseAdmin();
  const { data: subs } = await admin.from("push_subscriptions").select("*").eq("user_id", userId);
  if (!subs || subs.length === 0) return;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}
