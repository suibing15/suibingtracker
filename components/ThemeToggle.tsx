"use client";

import { useTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="theme-toggle" onClick={toggle} aria-label="Toggle dark/light theme" title="Toggle theme">
      {theme === "dark" ? "☀︎" : "☾"}
      <style jsx>{`
        .theme-toggle {
          background: transparent;
          border: 1px solid var(--line-strong);
          color: var(--text);
          border-radius: var(--radius-sm);
          width: 38px;
          height: 38px;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .theme-toggle:hover {
          border-color: var(--amber);
        }
      `}</style>
    </button>
  );
}
