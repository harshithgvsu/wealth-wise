import { useMemo, useState } from "react";
import { Trash2, ChevronDown, ChevronUp, Gift, CreditCard } from "lucide-react";
import { Expense, CATEGORY_COLORS } from "@/hooks/useExpenses";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

export function ExpenseList({ expenses, onDelete }: ExpenseListProps) {
  const [showAll, setShowAll] = useState(false);

  const sorted = [...expenses].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.createdAt - a.createdAt;
  });

  const totalRewards = useMemo(() => expenses.reduce((s, e) => s + (e.rewardsEarned || 0), 0), [expenses]);
  const visible = showAll ? sorted : sorted.slice(0, 8);

  const formatDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const grouped: Record<string, Expense[]> = {};
  for (const e of visible) { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e); }

  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold" style={{fontFamily:"'Syne',sans-serif"}}>Recent Expenses</h2>
          {totalRewards > 0 && (
            <p className="text-[11px] text-primary mt-0.5 flex items-center gap-1">
              <Gift size={10} /> {totalRewards.toFixed(2)} rewards earned
            </p>
          )}
        </div>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-border">
          {expenses.length}
        </span>
      </div>

      {expenses.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground text-sm">No expenses yet.</div>
      ) : (
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, exps]) => (
            <div key={date}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                {formatDate(date)}
              </p>
              <div className="space-y-1.5">
                {exps.map((exp) => (
                  <div key={exp.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: CATEGORY_COLORS[exp.category], boxShadow: `0 0 6px ${CATEGORY_COLORS[exp.category]}80` }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{exp.description}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                        <span>{exp.category}</span>
                        {exp.cardLabel && (
                          <span className="inline-flex items-center gap-1"><CreditCard size={9} /> {exp.cardLabel}</span>
                        )}
                        {(exp.rewardsEarned || 0) > 0 && (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Gift size={9} /> {exp.rewardsEarned?.toFixed(2)} {exp.rewardType}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-mono font-semibold flex-shrink-0">${exp.amount.toFixed(2)}</span>
                    <button onClick={() => onDelete(exp.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded"
                      title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {sorted.length > 8 && (
        <button onClick={() => setShowAll(!showAll)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto mt-1 transition-colors">
          {showAll ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Show {sorted.length - 8} more</>}
        </button>
      )}
    </div>
  );
}
