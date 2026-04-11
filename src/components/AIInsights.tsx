import { useState } from "react";
import { Sparkles, TrendingDown, TrendingUp, Lightbulb, Target, RefreshCw } from "lucide-react";
import { Expense, Category } from "@/hooks/useExpenses";

interface AIInsightsProps {
  expenses: Expense[];
  totalByCategory: Partial<Record<Category, number>>;
  monthTotal: number;
}

function generateInsights(expenses: Expense[], totalByCategory: Partial<Record<Category, number>>, monthTotal: number) {
  const sorted = Object.entries(totalByCategory).sort(([, a], [, b]) => b - a);
  const insights = [];

  const topCat = sorted[0];
  if (topCat) {
    const pct = ((topCat[1] / monthTotal) * 100).toFixed(0);
    insights.push({ type: "warn", title: `${topCat[0]} is your top expense`, body: `$${topCat[1].toFixed(0)} (${pct}% of budget). Cutting 20% saves ~$${(topCat[1] * 0.2).toFixed(0)}/month.`, icon: <TrendingDown size={15} />, color: "text-destructive", accent: "border-destructive/20 bg-destructive/5" });
  }

  const food = totalByCategory["Food & Dining"] || 0;
  if (food > 200) {
    insights.push({ type: "save", title: "Meal prep could save you money", body: `You're averaging $${(food / 28).toFixed(1)}/day on food. Cooking 3× per week could save ~$${(food * 0.35).toFixed(0)}/month.`, icon: <Lightbulb size={15} />, color: "text-amber-400", accent: "border-amber-400/20 bg-amber-400/5" });
  }

  const ent = totalByCategory["Entertainment"] || 0;
  if (ent > 50) {
    insights.push({ type: "save", title: "Review subscriptions", body: `$${ent.toFixed(0)} on entertainment. Most people have 2–3 unused subscriptions averaging $${(ent * 0.3).toFixed(0)}/month.`, icon: <Target size={15} />, color: "text-primary", accent: "border-primary/20 bg-primary/5" });
  }

  const savings = monthTotal * 0.15;
  insights.push({ type: "invest", title: "Investment opportunity", body: `Cutting 15% ($${savings.toFixed(0)}/mo) invested at 8% = ~$${(savings * 12 * 14.49).toFixed(0)} over 10 years.`, icon: <TrendingUp size={15} />, color: "text-primary", accent: "border-primary/20 bg-primary/5" });

  const avgPerDay = monthTotal / 18;
  insights.push({ type: "trend", title: "Month-end forecast", body: `At $${avgPerDay.toFixed(1)}/day you'll spend ~$${(avgPerDay * 28).toFixed(0)} this month.`, icon: <Sparkles size={15} />, color: "text-amber-400", accent: "border-amber-400/20 bg-amber-400/5" });

  const second = sorted[1];
  if (second) {
    insights.push({ type: "save", title: `Trim ${second[0]} costs`, body: `$${second[1].toFixed(0)} on ${second[0]}. Even 10% off saves $${(second[1] * 0.1).toFixed(0)}/month.`, icon: <Lightbulb size={15} />, color: "text-amber-400", accent: "border-amber-400/20 bg-amber-400/5" });
  }

  return insights;
}

export function AIInsights({ expenses, totalByCategory, monthTotal }: AIInsightsProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const insights = generateInsights(expenses, totalByCategory, monthTotal);

  return (
    <div className="glass-violet rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-accent/15">
            <Sparkles size={15} className="text-accent" />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{fontFamily:"'Syne',sans-serif"}}>AI Insights</h2>
            <p className="text-[11px] text-muted-foreground">Based on your spending patterns</p>
          </div>
        </div>
        <button onClick={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 900); }}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-accent transition-colors">
          <RefreshCw size={13} className={refreshing ? "animate-spin text-accent" : ""} />
        </button>
      </div>

      {monthTotal === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">Add expenses to get AI insights</div>
      ) : (
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <button key={i} onClick={() => setActiveIdx(activeIdx === i ? null : i)}
              className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                activeIdx === i ? insight.accent : "border-border bg-secondary/30 hover:bg-secondary/60"
              }`}>
              <div className="flex items-start gap-2.5">
                <span className={`mt-0.5 flex-shrink-0 ${insight.color}`}>{insight.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className={`text-xs text-muted-foreground mt-0.5 leading-relaxed transition-all ${activeIdx === i ? "block" : "line-clamp-1"}`}>
                    {insight.body}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/50 text-center mt-4 pt-3 border-t border-border">
        Click any insight to expand · updates based on your data
      </p>
    </div>
  );
}
