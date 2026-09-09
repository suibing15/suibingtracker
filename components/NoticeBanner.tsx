"use client";

import { useEffect, useState } from "react";
import { Profile } from "@/lib/supabaseClient";

type Props = { profile: Profile };

const dismissKey = (profile: Profile) => `suibingtracker-notice-dismissed-${profile.id}`;

export default function NoticeBanner({ profile }: Props) {
  const [dismissed, setDismissed] = useState(true); // start hidden until we check localStorage, avoids a flash

  useEffect(() => {
    if (!profile.admin_notice || !profile.admin_notice_set_at) {
      setDismissed(true);
      return;
    }
    const stored = window.localStorage.getItem(dismissKey(profile));
    setDismissed(stored === profile.admin_notice_set_at);
  }, [profile.admin_notice, profile.admin_notice_set_at, profile.id]);

  if (!profile.admin_notice || dismissed) return null;

  function dismiss() {
    if (profile.admin_notice_set_at) {
      window.localStorage.setItem(dismissKey(profile), profile.admin_notice_set_at);
    }
    setDismissed(true);
  }

  return (
    <div className="notice-banner">
      <span className="icon">🔔</span>
      <p>{profile.admin_notice}</p>
      <button onClick={dismiss} aria-label="Dismiss">✕</button>

      <style jsx>{`
        .notice-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: rgba(232, 163, 61, 0.1);
          border: 1px solid rgba(232, 163, 61, 0.35);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
          margin-bottom: 18px;
        }
        .icon {
          font-size: 16px;
          flex-shrink: 0;
        }
        p {
          flex: 1;
          font-size: 13px;
          color: var(--text);
          line-height: 1.6;
        }
        button {
          background: transparent;
          border: none;
          color: var(--text-faint);
          font-size: 13px;
          padding: 2px 4px;
          flex-shrink: 0;
        }
        button:hover {
          color: var(--text);
        }
      `}</style>
    </div>
  );
}
