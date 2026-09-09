"use client";

import { useState } from "react";
import CollapsibleCard from "./CollapsibleCard";

type GuideSection = {
  title: string;
  steps: { title: string; body: string }[];
};

const SECTIONS: GuideSection[] = [
  {
    title: "Getting started",
    steps: [
      {
        title: "Sign in",
        body: "Use the account your admin set up for you, or create a free account yourself from the sign-up page.",
      },
      {
        title: "Find your way around",
        body: "Everything lives in the sidebar on the left (or behind the ☰ menu on a phone). Dashboard is always the first thing you see after signing in.",
      },
    ],
  },
  {
    title: "Logging a spend",
    steps: [
      { title: "Open 'Log a spend'", body: "Select it from the sidebar." },
      {
        title: "Fill in the details",
        body: "Title, amount, date, category, and how you paid. A note is optional but helpful for remembering odd purchases later.",
      },
      {
        title: "Save it",
        body: "Tap 'Add expense'. If you've set a daily or monthly cap and this pushes you over it, you'll be asked to confirm — it still saves either way, it's just a nudge.",
      },
    ],
  },
  {
    title: "Tracking income",
    steps: [
      {
        title: "Log what comes in",
        body: "Open the Income section and use 'Log income' the same way you log a spend — source, amount, date received.",
      },
      {
        title: "Set your expected monthly income (optional)",
        body: "A separate figure from what you log — this is what you expect to earn, used only to compare against your spend and show you a percentage used.",
      },
    ],
  },
  {
    title: "Budgets and staying on track",
    steps: [
      {
        title: "Set your own cap",
        body: "In 'Budgets & projections', you can set or lower your own daily/monthly spending cap any time — a commitment device against your own spending.",
      },
      {
        title: "Raising a cap needs approval",
        body: "You can't raise an existing cap yourself — send a request to the admin from the same screen, and they can approve it by editing your account.",
      },
      {
        title: "Category budgets & the projector",
        body: "Set limits per category too, and check the expense projector for an estimate of where you'll land by month's end based on your current pace.",
      },
    ],
  },
  {
    title: "Reports",
    steps: [
      {
        title: "Filter first",
        body: "Set your date range, category, or search on the Dashboard — reports use whatever range is currently filtered.",
      },
      {
        title: "View or download",
        body: "'View PDF' opens a report straight in a new tab. 'Download CSV' gives you a spreadsheet-ready file. Both live under 'Reports & entries'.",
      },
      {
        title: "Fix a mistake",
        body: "Open 'Manage individual entries' inside the same section to delete a wrong entry.",
      },
    ],
  },
  {
    title: "Sending feedback",
    steps: [
      {
        title: "Go to My account",
        body: "You'll find a recommendation box (with a star rating) and a separate feature-request/complaint box.",
      },
      {
        title: "Be specific",
        body: "The more detail you give, the easier it is for the admin to act on it — they see everything you send, tagged by type.",
      },
    ],
  },
];

export default function GuideCard() {
  return (
    <CollapsibleCard
      eyebrow="Help"
      title="How to use this tracker"
      subtitle="A quick, plain-English walkthrough of everything in the app."
    >
      <div className="list">
        {SECTIONS.map((section, i) => (
          <GuideSectionBlock key={section.title} index={i + 1} section={section} />
        ))}
      </div>

      <style jsx>{`
        .list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
      `}</style>
    </CollapsibleCard>
  );
}

function GuideSectionBlock({ index, section }: { index: number; section: GuideSection }) {
  const [open, setOpen] = useState(index === 1);

  return (
    <div className="guide-section">
      <button className="section-head" onClick={() => setOpen((v) => !v)}>
        <span className="num">{index}</span>
        <span className="section-title">{section.title}</span>
        <span className={`chevron ${open ? "open" : ""}`}>›</span>
      </button>
      {open && (
        <ol className="steps">
          {section.steps.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      )}

      <style jsx>{`
        .guide-section {
          border-bottom: 1px solid var(--line);
        }
        .guide-section:last-child {
          border-bottom: none;
        }
        .section-head {
          width: 100%;
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 4px;
          text-align: left;
        }
        .num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(232, 163, 61, 0.15);
          color: var(--amber);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .section-title {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 14px;
          color: var(--text);
          flex: 1;
        }
        .chevron {
          color: var(--amber);
          font-size: 18px;
          transition: transform 0.15s ease;
        }
        .chevron.open {
          transform: rotate(90deg);
        }
        .steps {
          list-style: none;
          padding: 0 4px 18px 4px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .steps li {
          padding-left: 36px;
        }
        .steps strong {
          display: block;
          font-size: 13px;
          color: var(--text);
          margin-bottom: 4px;
        }
        .steps p {
          font-size: 13px;
          color: var(--text-dim);
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
