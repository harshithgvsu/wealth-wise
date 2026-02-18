import { useState } from "react";
import {
  Wallet,
  TrendingUp,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { StatCard } from "@/components/StatCard";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { SpendingChart } from "@/components/SpendingChart";
import { AIInsights } from "@/components/AIInsights";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Index() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { expenses, addExpense, deleteExpense, getMonthExpenses, getTotalByCategory } =
    useExpenses();

  const monthExpenses = getMonthExpenses(year, month);
  const totalByCategory = getTotalByCategory(monthExpenses);
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

  // Previous month for trend
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevExpenses = getMonthExpenses(prevYear, prevMonth);
  const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);
  const trend = prevTotal > 0 ? ((monthTotal - prevTotal) / prevTotal) * 100 : 0;

  const topCategory = Object.entries(totalByCategory).sort(([, a], [, b]) => b - a)[0];
  const uniqueDays = new Set(monthExpenses.map((e) => e.date)).size;
  const avgDaily = uniqueDays > 0 ? monthTotal / uniqueDays : 0;

  const goBack = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goForward = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-navy-border bg-navy-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center pulse-glow">
              <TrendingUp size={14} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-lg tracking-tight">
              Wealth<span className="text-gradient-primary">Wise</span>
            </span>
          </div>

          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-navy-surface transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-navy-surface min-w-[140px] justify-center">
              <CalendarDays size={13} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {MONTH_NAMES[month - 1]} {year}
              </span>
            </div>
            <button
              onClick={goForward}
              disabled={isCurrentMonth}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-navy-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Month Total"
            value={`$${monthTotal.toFixed(2)}`}
            trend={trend}
            icon={<Wallet size={16} />}
            variant="primary"
            delay={0}
          />
          <StatCard
            title="Daily Average"
            value={`$${avgDaily.toFixed(2)}`}
            subtitle={`${uniqueDays} active days`}
            icon={<BarChart3 size={16} />}
            variant="default"
            delay={80}
          />
          <StatCard
            title="Top Category"
            value={topCategory ? `$${topCategory[1].toFixed(0)}` : "$0"}
            subtitle={topCategory ? topCategory[0] : "—"}
            icon={<TrendingUp size={16} />}
            variant="gold"
            delay={160}
          />
          <StatCard
            title="Transactions"
            value={String(monthExpenses.length)}
            subtitle={`${prevExpenses.length} last month`}
            icon={<CalendarDays size={16} />}
            variant="default"
            delay={240}
          />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column: form + list */}
          <div className="lg:col-span-1 space-y-4">
            <ExpenseForm onAdd={addExpense} />
            <ExpenseList expenses={monthExpenses} onDelete={deleteExpense} />
          </div>

          {/* Right column: charts + AI */}
          <div className="lg:col-span-2 space-y-4">
            <SpendingChart
              expenses={expenses}
              totalByCategory={totalByCategory}
            />
            <AIInsights
              expenses={monthExpenses}
              totalByCategory={totalByCategory}
              monthTotal={monthTotal}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
