import { useState } from "react";
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  Lightbulb,
  Target,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Expense, Category } from "@/hooks/useExpenses";

interface AIInsightsProps {
  expenses: Expense[];
  totalByCategory: Partial<Record<Category, number>>;
  monthTotal: number;
}

interface Insight {
  type: "save" | "warn" | "invest" | "trend";
  title: string;
  body: string;
  icon: React.ReactNode;
  color: string;
}

function generateInsights(
  expenses: Expense[],
  totalByCategory: Partial<Record<Category, number>>,
  monthTotal: number
): Insight[] {
  const insights: Insight[] = [];

  // Find biggest spending categories
  const sorted = Object.entries(totalByCategory).sort(([, a], [, b]) => b - a);
  const topCat = sorted[0];
  const secondCat = sorted[1];

  if (topCat) {
    const pct = ((topCat[1] / monthTotal) * 100).toFixed(0);
    insights.push({
      type: "warn",
      title: `${topCat[0]} is your top expense`,
      body: `You've spent $${topCat[1].toFixed(0)} (${pct}% of your budget) on ${topCat[0]} this month. Consider reducing by 20% to save $${(topCat[1] * 0.2).toFixed(0)}.`,
      icon: <TrendingDown size={16} />,
      color: "text-destructive",
    });
  }

  // Food & Dining check
  const foodTotal = totalByCategory["Food & Dining"] || 0;
  if (foodTotal > 200) {
    const dailyAvg = foodTotal / 28;
    insights.push({
      type: "save",
      title: "Meal prep could save you money",
      body: `You're averaging $${dailyAvg.toFixed(1)}/day on food. Cooking 3 days/week instead of eating out could save ~$${(foodTotal * 0.35).toFixed(0)}/month.`,
      icon: <Lightbulb size={16} />,
      color: "text-gold",
    });
  }

  // Entertainment check
  const entertainTotal = totalByCategory["Entertainment"] || 0;
  if (entertainTotal > 50) {
    insights.push({
      type: "save",
      title: "Review subscriptions",
      body: `$${entertainTotal.toFixed(0)} on entertainment. Audit your subscriptions — most people have 2–3 unused ones averaging $${(entertainTotal * 0.3).toFixed(0)}/month.`,
      icon: <Target size={16} />,
      color: "text-emerald",
    });
  }

  // Savings potential
  const savingsPotential = monthTotal * 0.15;
  insights.push({
    type: "invest",
    title: "Investment opportunity",
    body: `If you cut 15% of monthly expenses ($${savingsPotential.toFixed(0)}), investing it at 8% annual return over 10 years = $${(savingsPotential * 12 * 14.49).toFixed(0)} in wealth.`,
    icon: <TrendingUp size={16} />,
    color: "text-emerald",
  });

  // Trend prediction
  const avgPerDay = monthTotal / 18; // ~18 days into Feb
  const predictedMonthEnd = avgPerDay * 28;
  insights.push({
    type: "trend",
    title: "Month-end forecast",
    body: `At your current pace ($${avgPerDay.toFixed(1)}/day), you'll spend ~$${predictedMonthEnd.toFixed(0)} this month. That's ${predictedMonthEnd > monthTotal * 1.5 ? "above" : "in line with"} your trend from last month.`,
    icon: <Sparkles size={16} />,
    color: "text-gold",
  });

  if (secondCat) {
    insights.push({
      type: "save",
      title: `Trim ${secondCat[0]} costs`,
      body: `$${secondCat[1].toFixed(0)} on ${secondCat[0]}. Look for discounts, alternatives or bundles — even 10% off saves $${(secondCat[1] * 0.1).toFixed(0)}/month.`,
      icon: <Lightbulb size={16} />,
      color: "text-gold",
    });
  }

  return insights;
}

export function AIInsights({
  expenses,
  totalByCategory,
  monthTotal,
}: AIInsightsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const insights = generateInsights(expenses, totalByCategory, monthTotal);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="glass-card border border-gold/20 rounded-xl p-5 glow-gold">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gold/15">
            <Sparkles size={16} className="text-gold" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              AI Insights
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Based on your spending patterns
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="text-muted-foreground hover:text-gold p-1.5"
        >
          <RefreshCw
            size={14}
            className={isRefreshing ? "animate-spin text-gold" : ""}
          />
        </Button>
      </div>

      {monthTotal === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          Add expenses to get AI insights
        </div>
      ) : (
        <div className="space-y-2.5">
          {insights.map((insight, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(activeIdx === i ? null : i)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${
                activeIdx === i
                  ? "border-gold/30 bg-gold/5"
                  : "border-navy-border bg-navy-surface/50 hover:border-navy-border/80 hover:bg-navy-surface"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex-shrink-0 ${insight.color}`}>
                  {insight.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {insight.title}
                  </p>
                  <p
                    className={`text-xs text-muted-foreground mt-1 leading-relaxed transition-all duration-200 ${
                      activeIdx === i ? "block" : "line-clamp-1"
                    }`}
                  >
                    {insight.body}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-navy-border">
        <p className="text-[10px] text-muted-foreground/60 text-center">
          AI insights update based on your spending data · Click any insight to expand
        </p>
      </div>
    </div>
  );
}
