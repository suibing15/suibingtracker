"use client";

import { useEffect, useState } from "react";
import { supabase, SavingsGoal } from "@/lib/supabaseClient";
import { formatMoney, formatDate } from "@/lib/config";

type Props = { userId: string };

export default function SavingsGoalsManager({ userId }: Props) {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "ok" | "error"; msg?: string }>({ kind: "idle" });
  const [contribInputs, setContribInputs] = useState<Record<string, string>>({});

  function flash(kind: "ok" | "error", msg: string) {
    setStatus({ kind, msg });
    setTimeout(() => setStatus({ kind: "idle" }), 2500);
  }

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("savings_goals").select("*").order("created_at", { ascending: true });
    setGoals((data as SavingsGoal[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addGoal() {
    if (!name.trim()) {
      setStatus({ kind: "error", msg: "Give this goal a name." });
      return;
    }
    const num = parseFloat(target);
    if (!num || num <= 0) {
      setStatus({ kind: "error", msg: "Enter a target amount greater than zero." });
      return;
    }
    setStatus({ kind: "busy" });
    const { error } = await supabase.from("savings_goals").insert({
      user_id: userId,
      name: name.trim(),
      target_amount: num,
      target_date: targetDate || null,
    });
    if (error) {
      setStatus({ kind: "error", msg: error.message });
      return;
    }
    setName("");
    setTarget("");
    setTargetDate("");
    setShowAdd(false);
    flash("ok", "Goal created.");
    load();
  }

  async function contribute(goal: SavingsGoal) {
    const raw = contribInputs[goal.id];
    const num = raw ? parseFloat(raw) : 0;
    if (!num || num <= 0) return;
    const { error } = await supabase
      .from("savings_goals")
      .update({ current_amount: Number(goal.current_amount) + num })
      .eq("id", goal.id);
    if (error) {
      flash("error", "Could not add contribution: " + error.message);
      return;
    }
    setContribInputs((prev) => ({ ...prev, [goal.id]: "" }));
    flash("ok", `Added ${formatMoney(num)} to ${goal.name}.`);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this savings goal? This cannot be undone.")) return;
    const { error } = await supabase.from("savings_goals").delete().eq("id", id);
    if (error) {
      flash("error", "Could not delete: " + error.message);
      return;
    }
    flash("ok", "Goal deleted.");
    load();
  }

  return (
    <div className="goals">
      <div className="head">
        <h3>Savings goals</h3>
        <button className="add-btn" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "Cancel" : "+ New goal"}
        </button>
      </div>

      {status.msg && <p className={status.kind === "error" ? "err" : "ok"}>{status.msg}</p>}

      {showAdd && (
        <div className="add-form">
          <div className="grid">
            <label className="field span-2">
              <span>Goal name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New laptop, Emergency fund" />
            </label>
            <label className="field">
              <span>Target amount (₦)</span>
              <input
                className="tab-nums"
                inputMode="decimal"
                value={target}
                onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
              />
            </label>
            <label className="field">
              <span>Target date (optional)</span>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </label>
          </div>
          <button className="save-btn" onClick={addGoal} disabled={status.kind === "busy"}>
            {status.kind === "busy" ? "Saving…" : "Create goal"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="empty">Loading…</p>
      ) : goals.length === 0 ? (
        <p className="empty">No savings goals yet — create one above.</p>
      ) : (
        <div className="list">
          {goals.map((g) => {
            const pct = Math.min(100, (Number(g.current_amount) / Number(g.target_amount)) * 100);
            const reached = Number(g.current_amount) >= Number(g.target_amount);
            return (
              <div className="goal-row" key={g.id}>
                <div className="goal-head">
                  <span className="goal-name">{g.name}</span>
                  <button className="del" onClick={() => remove(g.id)} aria-label="Delete">✕</button>
                </div>
                <div className="goal-amounts tab-nums">
                  {formatMoney(g.current_amount)} / {formatMoney(g.target_amount)}
                  {g.target_date && <span className="goal-date"> · by {formatDate(g.target_date)}</span>}
                </div>
                <div className="track">
                  <div className={`fill ${reached ? "done" : ""}`} style={{ width: `${pct}%` }} />
                </div>
                {reached ? (
                  <p className="reached">🎉 Goal reached!</p>
                ) : (
                  <div className="contrib-row">
                    <input
                      className="tab-nums"
                      inputMode="decimal"
                      value={contribInputs[g.id] ?? ""}
                      onChange={(e) =>
                        setContribInputs((prev) => ({ ...prev, [g.id]: e.target.value.replace(/[^0-9.]/g, "") }))
                      }
                      placeholder="Add contribution (₦)"
                    />
                    <button className="contrib-btn" onClick={() => contribute(g)}>Add</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .goals {
          margin-top: 4px;
        }
        .head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        h3 {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 600;
        }
        .add-btn {
          background: transparent;
          border: 1px solid var(--amber);
          color: var(--text);
          border-radius: var(--radius-sm);
          padding: 7px 13px;
          font-size: 12px;
          font-weight: 600;
        }
        .add-form {
          background: var(--ink);
          border: 1px solid var(--line-strong);
          border-radius: var(--radius-sm);
          padding: 16px;
          margin-bottom: 16px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }
        .span-2 {
          grid-column: span 2;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .field span {
          font-size: 11px;
          color: var(--text-dim);
        }
        input {
          background: var(--ink-2);
          border: 1px solid var(--line-strong);
          border-radius: var(--radius-sm);
          color: var(--text);
          padding: 9px 11px;
          font-size: 13px;
          width: 100%;
        }
        input:focus {
          outline: none;
          border-color: var(--amber);
        }
        .save-btn {
          background: var(--amber);
          color: #201603;
          border: none;
          border-radius: var(--radius-sm);
          padding: 10px 18px;
          font-weight: 600;
          font-size: 13px;
        }
        .err {
          color: var(--coral);
          font-size: 12px;
          margin-top: 8px;
        }
        .ok {
          color: var(--mint);
          font-size: 12px;
          margin-top: 8px;
          margin-bottom: 12px;
        }
        .empty {
          color: var(--text-faint);
          font-size: 13px;
        }
        .list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .goal-row {
          background: var(--ink);
          border: 1px solid var(--line);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
        }
        .goal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .goal-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }
        .del {
          background: transparent;
          border: none;
          color: var(--text-faint);
          font-size: 13px;
          padding: 4px 6px;
        }
        .del:hover {
          color: var(--coral);
        }
        .goal-amounts {
          font-size: 13px;
          color: var(--text-dim);
          margin-top: 6px;
        }
        .goal-date {
          color: var(--text-faint);
        }
        .track {
          height: 8px;
          background: var(--ink-3);
          border-radius: 6px;
          overflow: hidden;
          margin-top: 10px;
        }
        .fill {
          height: 100%;
          background: var(--mint);
          border-radius: 6px;
          transition: width 0.4s ease;
        }
        .fill.done {
          background: var(--amber);
        }
        .reached {
          margin-top: 10px;
          font-size: 13px;
          color: var(--amber);
          font-weight: 600;
        }
        .contrib-row {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        .contrib-row input {
          flex: 1;
        }
        .contrib-btn {
          background: var(--amber);
          color: #201603;
          border: none;
          border-radius: var(--radius-sm);
          padding: 9px 16px;
          font-weight: 600;
          font-size: 12px;
          white-space: nowrap;
        }
        @media (max-width: 480px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .span-2 {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}
