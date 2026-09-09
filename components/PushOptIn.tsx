"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  return arr.buffer as ArrayBuffer;
}

type Props = { userId: string };

export default function PushOptIn({ userId }: Props) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window;
    setSupported(ok);
    if (!ok) return;
    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      setSubscribed(Boolean(existing));
    });
  }, []);

  async function enable() {
    setMsg(null);
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      setMsg("Push isn't configured on this deployment yet (missing VAPID key).");
      return;
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMsg("Notifications permission was not granted.");
        setBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = sub.toJSON();
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          endpoint: json.endpoint as string,
          p256dh: json.keys?.p256dh as string,
          auth_key: json.keys?.auth as string,
        },
        { onConflict: "endpoint" }
      );
      if (error) {
        setMsg(error.message);
        setBusy(false);
        return;
      }
      setSubscribed(true);
      setMsg("Notifications enabled on this device.");
    } catch (err: any) {
      setMsg(err.message ?? "Could not enable notifications.");
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMsg("Notifications disabled on this device.");
    } catch (err: any) {
      setMsg(err.message ?? "Could not disable notifications.");
    }
    setBusy(false);
  }

  if (!supported) {
    return <p className="unsupported">Push notifications aren't supported in this browser.</p>;
  }

  return (
    <div className="push-optin">
      <div className="row">
        <div>
          <span className="status-label">{subscribed ? "Enabled on this device" : "Not enabled on this device"}</span>
          <p className="hint">
            Get a push alert for bills due, over-budget warnings, and admin notices — even when the app isn't open.
          </p>
        </div>
        {subscribed ? (
          <button className="btn ghost" onClick={disable} disabled={busy}>
            {busy ? "…" : "Disable"}
          </button>
        ) : (
          <button className="btn" onClick={enable} disabled={busy}>
            {busy ? "…" : "Enable"}
          </button>
        )}
      </div>
      {msg && <p className="msg">{msg}</p>}

      <style jsx>{`
        .push-optin {
          margin-top: 4px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }
        .status-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }
        .hint {
          color: var(--text-faint);
          font-size: 12px;
          line-height: 1.6;
          margin-top: 6px;
          max-width: 420px;
        }
        .btn {
          background: var(--amber);
          color: #201603;
          border: none;
          border-radius: var(--radius-sm);
          padding: 9px 16px;
          font-weight: 600;
          font-size: 13px;
          white-space: nowrap;
        }
        .btn.ghost {
          background: transparent;
          border: 1px solid var(--line-strong);
          color: var(--text-dim);
        }
        .btn:disabled {
          opacity: 0.6;
        }
        .msg {
          margin-top: 10px;
          font-size: 12px;
          color: var(--text-dim);
        }
        .unsupported {
          color: var(--text-faint);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
