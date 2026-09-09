"use client";

import { Profile } from "@/lib/supabaseClient";
import ThemeToggle from "./ThemeToggle";

type Props = {
  profile: Profile;
  onSignOut: () => void;
};

export default function LockedScreen({ profile, onSignOut }: Props) {
  return (
    <main className="lock-wrap">
      <div className="toggle-corner">
        <ThemeToggle />
      </div>

      <div className="lock-card">
        <div className="lock-icon">🔒</div>
        <span className="eyebrow">Account restricted</span>
        <h1>Access paused</h1>
        <p className="lead">
          Your account has been restricted by an admin. Your data is safe and untouched — this
          just isn't the right time to sign in.
        </p>

        {profile.admin_notice && (
          <div className="admin-note">
            <span className="note-label">Note from your admin</span>
            <p>{profile.admin_notice}</p>
          </div>
        )}

        <p className="sub">
          If you think this is a mistake, reach out to whoever manages your account
          {profile.email ? (
            <>
              {" "}— they'll know it from <span className="tab-nums email">{profile.email}</span>.
            </>
          ) : (
            "."
          )}
        </p>

        <button className="signout-btn" onClick={onSignOut}>
          Sign out
        </button>
      </div>

      <style jsx>{`
        .lock-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
        }
        .toggle-corner {
          position: absolute;
          top: 20px;
          right: 20px;
        }
        .lock-card {
          width: 100%;
          max-width: 440px;
          background: linear-gradient(180deg, var(--ink-2), var(--ink));
          border: 1px solid var(--line-strong);
          border-radius: var(--radius);
          padding: 36px 32px;
          box-shadow: var(--shadow);
          text-align: center;
        }
        .lock-icon {
          font-size: 34px;
          margin-bottom: 14px;
        }
        .eyebrow {
          font-family: var(--font-display);
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--coral);
        }
        h1 {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 700;
          margin-top: 8px;
        }
        .lead {
          color: var(--text-dim);
          font-size: 14px;
          line-height: 1.65;
          margin-top: 14px;
        }
        .admin-note {
          text-align: left;
          margin-top: 20px;
          background: rgba(232, 163, 61, 0.1);
          border: 1px solid rgba(232, 163, 61, 0.3);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
        }
        .note-label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--amber);
          margin-bottom: 6px;
        }
        .admin-note p {
          color: var(--text);
          font-size: 13px;
          line-height: 1.6;
        }
        .sub {
          color: var(--text-faint);
          font-size: 12px;
          line-height: 1.6;
          margin-top: 22px;
        }
        .email {
          color: var(--text-dim);
          word-break: break-all;
        }
        .signout-btn {
          margin-top: 26px;
          width: 100%;
          background: transparent;
          border: 1px solid var(--line-strong);
          color: var(--text);
          border-radius: var(--radius-sm);
          padding: 13px 24px;
          font-weight: 600;
          font-size: 14px;
          font-family: var(--font-display);
        }
        .signout-btn:hover {
          border-color: var(--coral);
          color: var(--coral);
        }

        @media (max-width: 480px) {
          .lock-card {
            padding: 28px 22px;
          }
          h1 {
            font-size: 22px;
          }
          .toggle-corner {
            top: 14px;
            right: 14px;
          }
        }
      `}</style>
    </main>
  );
}
