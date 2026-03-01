import { useMemo, useState } from "react";
import { Trash2, ChevronDown, ChevronUp, Gift, CreditCard } from "lucide-react";
import { Expense, CATEGORY_COLORS } from "@/hooks/useExpenses";
import { Button } from "@/components/ui/button";

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

  const totalRewards = useMemo(
    () => expenses.reduce((sum, exp) => sum + (exp.rewardsEarned || 0), 0),
    [expenses]
  );

  const visible = showAll ? sorted : sorted.slice(0, 8);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const groupedByDate: Record<string, Expense[]> = {};
  for (const exp of visible) {
    if (!groupedByDate[exp.date]) groupedByDate[exp.date] = [];
    groupedByDate[exp.date].push(exp);
  }

  return (
    <div className="glass-card border border-navy-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Recent Expenses
          </h2>
          <p className="text-[11px] text-primary/90 mt-0.5 flex items-center gap-1.5">
            <Gift size={11} />
            Rewards this view: {totalRewards.toFixed(2)} pts/cashback/miles
          </p>
        </div>
        <span className="text-xs text-muted-foreground bg-navy-surface px-2 py-0.5 rounded-full">
          {expenses.length} total
        </span>
      </div>

      {expenses.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground text-sm">
          No expenses yet. Add your first one!
        </div>
      ) : (
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {Object.entries(groupedByDate)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, exps]) => (
              <div key={date}>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                  {formatDate(date)}
                </p>
                <div className="space-y-1.5">
                  {exps.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-navy-surface/60 hover:bg-navy-surface transition-colors group"
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          background: CATEGORY_COLORS[exp.category],
                          boxShadow: `0 0 6px ${CATEGORY_COLORS[exp.category]}80`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {exp.description}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                          <span>{exp.category}</span>
                          {exp.cardLabel && (
                            <span className="inline-flex items-center gap-1">
                              <CreditCard size={10} /> {exp.cardLabel}
                            </span>
                          )}
                          {(exp.rewardsEarned || 0) > 0 && (
                            <span className="inline-flex items-center gap-1 text-primary/90">
                              <Gift size={10} /> {exp.rewardsEarned?.toFixed(2)} {exp.rewardType || "points"}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-mono font-semibold text-foreground flex-shrink-0">
                        ${exp.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => onDelete(exp.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {sorted.length > 8 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="text-muted-foreground hover:text-foreground text-xs mt-1"
        >
          {showAll ? (
            <>
              <ChevronUp size={14} /> Show less
            </>
          ) : (
            <>
              <ChevronDown size={14} /> Show {sorted.length - 8} more
            </>
          )}
        </Button>
      )}
    </div>
  );
}
