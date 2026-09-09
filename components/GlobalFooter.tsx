"use client";

export default function GlobalFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="global-footer">
      <span>© {year} Suibing IT Services. All rights reserved.</span>
      <style jsx>{`
        .global-footer {
          text-align: center;
          padding: 18px 16px 24px;
          color: var(--text-faint);
          font-size: 11px;
        }
      `}</style>
    </footer>
  );
}
