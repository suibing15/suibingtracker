"use client";

const WHATSAPP_NUMBER = "2347080195042"; // no + or leading zeros, per wa.me format

export default function WhatsAppButton() {
  return (
    <a
      className="wa-btn"
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16.001 2.667c-7.363 0-13.334 5.97-13.334 13.333 0 2.352.615 4.646 1.782 6.665l-1.897 6.933a1 1 0 0 0 1.227 1.227l6.933-1.897a13.29 13.29 0 0 0 6.665 1.782h.003c7.363 0 13.333-5.97 13.333-13.334S23.364 2.667 16.001 2.667"
          fill="#25D366"
        />
        <path
          d="M12.077 9.28c-.267-.593-.548-.605-.802-.615-.208-.009-.446-.008-.684-.008-.238 0-.624.089-.951.446-.327.357-1.25 1.221-1.25 2.978s1.28 3.455 1.458 3.693c.178.238 2.469 3.958 6.1 5.391 3.017 1.19 3.632.953 4.288.894.655-.06 2.115-.865 2.412-1.7.298-.834.298-1.55.208-1.699-.089-.148-.327-.238-.684-.416s-2.115-1.044-2.443-1.163c-.327-.119-.565-.178-.803.179-.238.357-.921 1.163-1.13 1.401-.208.238-.416.268-.773.09-.357-.18-1.507-.556-2.871-1.772-1.061-.946-1.777-2.114-1.985-2.472-.208-.357-.022-.55.157-.727.161-.16.357-.417.535-.625.179-.208.238-.357.357-.595.119-.238.06-.446-.03-.625-.089-.178-.783-1.964-1.109-2.66"
          fill="#fff"
        />
      </svg>

      <style jsx>{`
        .wa-btn {
          position: fixed;
          bottom: 22px;
          right: 22px;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #25d366;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 28px -6px rgba(37, 211, 102, 0.55), 0 4px 12px rgba(0, 0, 0, 0.25);
          z-index: 60;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          animation: wa-pulse 2.6s ease-in-out infinite;
        }
        .wa-btn:hover {
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
          .wa-btn {
            width: 52px;
            height: 52px;
            bottom: 18px;
            right: 16px;
          }
        }
      `}</style>
    </a>
  );
}
