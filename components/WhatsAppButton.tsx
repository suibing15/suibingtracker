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
        {/* Verified WhatsApp glyph — real bubble-with-tail + handset mark,
            not a generic phone icon. */}
        <svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#25D366" />
          <path
            fill="#FFFFFF"
            d="M16 5.333c-5.891 0-10.667 4.776-10.667 10.667 0 1.897.505 3.68 1.386 5.219L5.333 26.667l5.596-1.354a10.61 10.61 0 0 0 5.071 1.291c5.891 0 10.667-4.776 10.667-10.667S21.891 5.333 16 5.333z"
          />
          <path
            fill="#25D366"
            d="M21.63 18.936c-.297-.15-1.758-.868-2.031-.967-.272-.1-.47-.15-.669.149-.198.298-.767.967-.94 1.166-.173.198-.347.223-.644.074-.297-.149-1.254-.462-2.39-1.475-.883-.787-1.48-1.76-1.653-2.058-.173-.298-.018-.459.13-.607.134-.133.298-.347.446-.52.15-.174.199-.298.298-.497.1-.198.05-.372-.025-.521-.075-.149-.67-1.612-.917-2.208-.242-.578-.488-.5-.67-.51-.173-.008-.372-.01-.57-.01-.199 0-.521.075-.793.372-.273.298-1.04 1.017-1.04 2.48 0 1.462 1.065 2.874 1.213 3.073.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.713.226 1.362.194 1.874.118.572-.086 1.759-.719 2.006-1.414.248-.694.248-1.289.173-1.413-.074-.124-.273-.198-.57-.347z"
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
          max-width: calc(100vw - 32px);
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
        /* Mobile: keep the label visible (this was hidden before and
           shouldn't have been) — just shrink and allow it to wrap onto two
           lines instead of forcing single-line width off-screen. */
        @media (max-width: 480px) {
          .wa-wrap {
            bottom: 16px;
            right: 14px;
            gap: 8px;
          }
          .wa-btn {
            width: 50px;
            height: 50px;
          }
          .wa-btn svg {
            width: 28px;
            height: 28px;
          }
          .wa-label {
            font-size: 11.5px;
            padding: 7px 10px;
            white-space: normal;
            max-width: 130px;
            line-height: 1.4;
          }
        }
      `}</style>
    </a>
  );
}
