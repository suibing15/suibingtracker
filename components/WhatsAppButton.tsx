"use client";

import { useState } from "react";

const WHATSAPP_NUMBER = "2347080195042"; // no + or leading zeros, per wa.me format

export default function WhatsAppButton() {
  const [showLabel, setShowLabel] = useState(true);

  return (
    <a
      className="wa-wrap"
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message the developer on WhatsApp"
      title="Message the developer on WhatsApp"
      onMouseEnter={() => setShowLabel(true)}
    >
      {showLabel && (
        <span className="wa-label">
          Message the developer
          <button
            className="wa-close"
            aria-label="Dismiss"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowLabel(false);
            }}
          >
            ✕
          </button>
        </span>
      )}

      <span className="wa-btn">
        {/* Official-style WhatsApp glyph: speech bubble + handset, matching
            the real logo's proportions rather than a generic phone icon. */}
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12.01 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.08-1.33A9.95 9.95 0 0 0 12.01 22C17.53 22 22 17.52 22 12S17.53 2 12.01 2Z"
            fill="#25D366"
          />
          <path
            d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.24-.46-2.37-1.46-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z"
            fill="#fff"
          />
        </svg>
      </span>

      <style jsx>{`
        .wa-wrap {
          position: fixed;
          bottom: 22px;
          right: 22px;
          z-index: 60;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .wa-label {
          background: #202c33;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          padding: 10px 14px;
          border-radius: 10px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }
        .wa-close {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: #fff;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          font-size: 9px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .wa-btn {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #25d366;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 10px 28px -6px rgba(37, 211, 102, 0.55), 0 4px 12px rgba(0, 0, 0, 0.25);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          animation: wa-pulse 2.6s ease-in-out infinite;
        }
        .wa-wrap:hover .wa-btn {
          transform: scale(1.08);
          box-shadow: 0 14px 34px -6px rgba(37, 211, 102, 0.65), 0 6px 16px rgba(0, 0, 0, 0.3);
        }
        @keyframes wa-pulse {
          0%,
          100% {
            box-shadow: 0 10px 28px -6px rgba(37, 211, 102, 0.55), 0 4px 12px rgba(0, 0, 0, 0.25), 0 0 0 0 rgba(37, 211, 102, 0.5);
          }
          50% {
            box-shadow: 0 10px 28px -6px rgba(37, 211, 102, 0.55), 0 4px 12px rgba(0, 0, 0, 0.25), 0 0 0 10px rgba(37, 211, 102, 0);
          }
        }
        @media (max-width: 640px) {
          .wa-wrap {
            bottom: 18px;
            right: 16px;
          }
          .wa-btn {
            width: 52px;
            height: 52px;
          }
          .wa-label {
            font-size: 12px;
            padding: 8px 12px;
          }
        }
        @media (max-width: 420px) {
          /* Too tight on very small phones — icon alone, label still
             reachable via long-press/tooltip (title attribute). */
          .wa-label {
            display: none;
          }
        }
      `}</style>
    </a>
  );
}
