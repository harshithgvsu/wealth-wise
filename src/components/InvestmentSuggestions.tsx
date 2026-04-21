import { useMemo } from "react";
import {
  TrendingUp,
  PieChart,
  BarChart2,
  Shield,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  Info,
  PiggyBank,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { Expense } from "@/hooks/useExpenses";
import { UserProfile } from "@/hooks/useAuth";

interface InvestmentSuggestionsProps {
  expenses: Expense[];
  userProfile: UserProfile;
  currentMonth: number;
  currentYear: number;
}

interface Suggestion {
  ticker: string;
  name: string;
  type: string;
  allocation: number;
  rationale: string;
  risk: "Low" | "Medium" | "High";
  expectedReturn: string;
}

function RiskBadge({ risk }: { risk: "Low" | "Medium" | "High" }) {
  const colors = {
    Low: "text-primary bg-primary/10 border-primary/20",
    Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    High: "text-destructive bg-destructive/10 border-destructive/20",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors[risk]}`}>
      {risk}
    </span>
  );
}

export function InvestmentSuggestions({ expenses, userProfile, currentMonth, currentYear }: InvestmentSuggestionsProps) {
  const analysis = useMemo(() => {
    const now = new Date();
    const paychecks = userProfile.paychecks || [];
    const savingsAccounts = userProfile.savingsAccounts || [];
    const totalSavingsPerPaycheck = savingsAccounts.reduce((s, a) => s + a.amountPerPaycheck, 0);

    // Avg monthly spend (last 3 months)
    const last3Totals: number[] = [];
    for (let i = 0; i < 3; i++) {
      let m = now.getMonth() + 1 - i;
      let y = now.getFullYear();
      if (m <= 0) { m += 12; y -= 1; }
      const total = expenses
        .filter((e) => {
          const d = new Date(e.date);
          return d.getFullYear() === y && d.getMonth() + 1 === m;
        })
        .reduce((s, e) => s + e.amount, 0);
      last3Totals.push(total);
    }
    const avgMonthlySpend = last3Totals.reduce((s, v) => s + v, 0) / Math.max(last3Totals.filter(Boolean).length, 1);
    const spendTrend = last3Totals[1] > 0 ? (last3Totals[0] - last3Totals[1]) / last3Totals[1] : 0;

    // Current month budget using paycheck model
    const currentMonthPaychecks = paychecks.filter((p) => {
      const d = new Date(p.date);
      return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
    });
    const monthlyPaycheckIncome = currentMonthPaychecks.reduce((s, p) => s + p.amount, 0);
    const monthlySavings = totalSavingsPerPaycheck * currentMonthPaychecks.length;
    const expenseLimit = Math.max(0, monthlyPaycheckIncome - monthlySavings);

    // Fixed expenses from profile
    const fixedExpenses =
      userProfile.rentMortgage + userProfile.carPayment +
      userProfile.insurancePremiums + userProfile.subscriptions +
      userProfile.otherFixedExpenses;

    // Investable = expense limit - avg spend - fixed expenses (if any not already counted)
    // If paycheck model is active, use it; otherwise fall back
    let monthlyInvestable: number;
    let monthlyBudgetBase: number;

    if (currentMonthPaychecks.length > 0) {
      monthlyInvestable = Math.max(0, expenseLimit - avgMonthlySpend);
      monthlyBudgetBase = expenseLimit;
    } else {
      const disposable = userProfile.netMonthlyIncome - fixedExpenses;
      const savingsTarget = (userProfile.savingsGoalPercent / 100) * userProfile.netMonthlyIncome;
      monthlyInvestable = Math.max(0, disposable - avgMonthlySpend - savingsTarget * 0.5);
      monthlyBudgetBase = disposable;
    }

    const annualInvestable = monthlyInvestable * 12;
    const annualSavings = totalSavingsPerPaycheck * 26; // 26 paychecks/year (bi-weekly)

    // Current month actuals
    const currentMonthSpend = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
      })
      .reduce((s, e) => s + e.amount, 0);

    const currentMonthSurplus = Math.max(0, expenseLimit - currentMonthSpend);
    const onTrack = currentMonthSpend <= expenseLimit;
    const overspendAmount = Math.max(0, currentMonthSpend - expenseLimit);

    // Top spending categories this month
    const catTotals: Record<string, number> = {};
    expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
      })
      .forEach((e) => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
    const topCategories = Object.entries(catTotals).sort(([, a], [, b]) => b - a).slice(0, 3);

    return {
      avgMonthlySpend, spendTrend, fixedExpenses, monthlyInvestable, annualInvestable,
      monthlyPaycheckIncome, monthlySavings, expenseLimit, currentMonthSurplus,
      onTrack, overspendAmount, topCategories, currentMonthSpend, monthlyBudgetBase,
      annualSavings, totalSavingsPerPaycheck, savingsAccounts, currentMonthPaychecks,
      usingPaycheckModel: currentMonthPaychecks.length > 0,
    };
  }, [expenses, userProfile, currentMonth, currentYear]);

  const portfolio = useMemo((): Suggestion[] => {
    const { riskTolerance, investmentGoal, investmentHorizonYears } = userProfile;
    const longHorizon = investmentHorizonYears > 15;

    if (riskTolerance === "conservative") {
      return [
        { ticker: "BND", name: "Vanguard Total Bond Market ETF", type: "Bond Index", allocation: 40, rationale: "Stable income, low volatility — core for conservative portfolios", risk: "Low", expectedReturn: "3–5%" },
        { ticker: "VTI", name: "Vanguard Total Stock Market ETF", type: "US Equity Index", allocation: 30, rationale: "Broad US market exposure, diversified across 4000+ stocks", risk: "Medium", expectedReturn: "7–10%" },
        { ticker: "VXUS", name: "Vanguard Total International Stock ETF", type: "International Equity", allocation: 15, rationale: "Diversification across developed and emerging markets", risk: "Medium", expectedReturn: "6–9%" },
        { ticker: "VNQ", name: "Vanguard Real Estate ETF", type: "REIT", allocation: 10, rationale: "Real estate income with inflation hedge properties", risk: "Medium", expectedReturn: "5–8%" },
        { ticker: "SGOV", name: "iShares 0-3 Month Treasury Bond ETF", type: "Cash Equivalent", allocation: 5, rationale: "Liquid emergency reserves earning 5%+ yield", risk: "Low", expectedReturn: "4–5%" },
      ];
    }

    if (riskTolerance === "aggressive") {
      return [
        { ticker: "VTI", name: "Vanguard Total Stock Market ETF", type: "US Equity Index", allocation: longHorizon ? 45 : 40, rationale: "Maximum US equity exposure for long-term growth compounding", risk: "Medium", expectedReturn: "7–10%" },
        { ticker: "QQQ", name: "Invesco QQQ (Nasdaq-100 ETF)", type: "Tech Growth", allocation: 20, rationale: "High-growth tech exposure — Apple, NVDA, Microsoft, Alphabet", risk: "High", expectedReturn: "10–15%" },
        { ticker: "VXUS", name: "Vanguard Total International", type: "International Equity", allocation: 20, rationale: "Global diversification, especially emerging market growth", risk: "Medium", expectedReturn: "6–9%" },
        { ticker: "VB", name: "Vanguard Small-Cap ETF", type: "Small Cap", allocation: 10, rationale: "Small-cap historically outperforms over long horizons", risk: "High", expectedReturn: "9–13%" },
        { ticker: "VWO", name: "Vanguard Emerging Markets ETF", type: "Emerging Markets", allocation: longHorizon ? 5 : 10, rationale: investmentGoal === "growth" ? "High-upside developing economies (India, Brazil, Taiwan)" : "Modest EM allocation for diversification", risk: "High", expectedReturn: "8–12%" },
      ];
    }

    return [
      { ticker: "VTI", name: "Vanguard Total Stock Market ETF", type: "US Equity Index", allocation: 40, rationale: "Core US market exposure — the backbone of any portfolio", risk: "Medium", expectedReturn: "7–10%" },
      { ticker: "VXUS", name: "Vanguard Total International Stock ETF", type: "International Equity", allocation: 20, rationale: "Developed markets provide stability and currency diversification", risk: "Medium", expectedReturn: "6–9%" },
      { ticker: "BND", name: "Vanguard Total Bond Market ETF", type: "Bond Index", allocation: 20, rationale: "Fixed income cushion, reduces portfolio volatility during downturns", risk: "Low", expectedReturn: "3–5%" },
      { ticker: "VNQ", name: "Vanguard Real Estate ETF", type: "REIT", allocation: 10, rationale: investmentGoal === "property" ? "Real estate alignment with your property goal" : "Inflation hedge and dividend income from real estate", risk: "Medium", expectedReturn: "5–8%" },
      { ticker: "QQQ", name: "Invesco QQQ ETF", type: "Tech Growth", allocation: 10, rationale: "Growth kicker via top-100 NASDAQ companies", risk: "High", expectedReturn: "10–15%" },
    ];
  }, [userProfile]);

  const futureValue = (monthly: number, years: number, rate = 0.07) => {
    if (monthly <= 0 || years <= 0) return 0;
    const n = years * 12;
    const r = rate / 12;
    return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  };

  const fv10 = futureValue(analysis.monthlyInvestable, 10);
  const fv20 = futureValue(analysis.monthlyInvestable, 20);
  const fvHorizon = futureValue(analysis.monthlyInvestable, userProfile.investmentHorizonYears);

  const RiskIcon = { conservative: Shield, moderate: BarChart2, aggressive: Zap }[userProfile.riskTolerance];

  return (
    <div className="space-y-4">

      {/* Budget & surplus card */}
      <div className="glass rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <TrendingUp size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="text-foreground font-bold">Investment Analysis</h2>
            <p className="text-xs text-muted-foreground capitalize">
              {userProfile.riskTolerance} risk · {userProfile.investmentHorizonYears}yr horizon · {userProfile.investmentGoal} goal
            </p>
          </div>
        </div>

        {/* Paycheck model summary */}
        {analysis.usingPaycheckModel && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <PiggyBank size={12} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Monthly Savings</span>
              </div>
              <p className="text-foreground font-bold text-sm">${analysis.monthlySavings.toLocaleString()}<span className="text-muted-foreground text-xs font-normal">/mo</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">
                ${analysis.totalSavingsPerPaycheck.toLocaleString()}/paycheck × {analysis.currentMonthPaychecks.length}
              </p>
            </div>
            <div className={`rounded-xl p-3 border ${analysis.onTrack ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {analysis.onTrack
                  ? <CheckCircle2 size={12} className="text-primary" />
                  : <AlertTriangle size={12} className="text-destructive" />}
                <span className={`text-xs font-medium ${analysis.onTrack ? "text-primary" : "text-destructive"}`}>
                  {analysis.onTrack ? "On Track" : "Over Budget"}
                </span>
              </div>
              <p className="text-foreground font-bold text-sm">
                {analysis.onTrack
                  ? `$${analysis.currentMonthSurplus.toFixed(0)}`
                  : `-$${analysis.overspendAmount.toFixed(0)}`}
                <span className="text-muted-foreground text-xs font-normal"> this month</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {analysis.onTrack ? "under expense limit" : "over expense limit"}
              </p>
            </div>
          </div>
        )}

        {/* Health indicators */}
        {!analysis.usingPaycheckModel && (
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-3 border ${analysis.avgMonthlySpend < analysis.monthlyBudgetBase * 0.8 ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {analysis.avgMonthlySpend < analysis.monthlyBudgetBase * 0.8
                  ? <CheckCircle2 size={13} className="text-primary" />
                  : <AlertTriangle size={13} className="text-destructive" />}
                <span className={`text-xs font-medium ${analysis.avgMonthlySpend < analysis.monthlyBudgetBase * 0.8 ? "text-primary" : "text-destructive"}`}>Spending Health</span>
              </div>
              <p className="text-foreground font-bold text-sm">${analysis.avgMonthlySpend.toFixed(0)}<span className="text-muted-foreground text-xs font-normal">/mo avg</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">{analysis.avgMonthlySpend < analysis.monthlyBudgetBase * 0.8 ? "Under 80% budget ✓" : "Exceeds budget target"}</p>
            </div>
            <div className={`rounded-xl p-3 border ${analysis.monthlyInvestable > 0 ? "border-amber-400/20 bg-amber-400/5" : "border-muted"}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Target size={13} className="text-amber-400" />
                <span className="text-xs font-medium text-amber-400">Monthly Investable</span>
              </div>
              <p className="text-foreground font-bold text-sm">${analysis.monthlyInvestable.toFixed(0)}<span className="text-muted-foreground text-xs font-normal">/mo</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">${analysis.annualInvestable.toFixed(0)}/year potential</p>
            </div>
          </div>
        )}

        {/* Trend alert */}
        {Math.abs(analysis.spendTrend) > 0.05 && (
          <div className={`rounded-lg p-2.5 border text-xs flex gap-2 ${analysis.spendTrend > 0 ? "border-destructive/20 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5 text-primary"}`}>
            <Info size={13} className="shrink-0 mt-0.5" />
            <span>
              Spending is{" "}
              <strong>{analysis.spendTrend > 0 ? `up ${(analysis.spendTrend * 100).toFixed(0)}%` : `down ${(Math.abs(analysis.spendTrend) * 100).toFixed(0)}%`}</strong>{" "}
              vs. last month.{" "}
              {analysis.spendTrend > 0 ? "Cutting back increases your investable amount." : "Great — redirect that surplus into investments!"}
            </span>
          </div>
        )}
      </div>

      {/* Personalized action card */}
      {analysis.usingPaycheckModel && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Target size={15} className="text-amber-400" />
            <h3 className="text-foreground font-semibold text-sm">This Month's Action Plan</h3>
          </div>

          {analysis.onTrack ? (
            <>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-primary mb-1">You're on track! 🎉</p>
                <p className="text-xs text-muted-foreground">
                  You have <span className="text-foreground font-medium">${analysis.currentMonthSurplus.toFixed(0)}</span> left to spend this month.
                  If you stay under your limit, here's how to deploy the surplus:
                </p>
              </div>
              {analysis.currentMonthSurplus > 0 && (
                <div className="space-y-2">
                  {portfolio.slice(0, 3).map((s) => {
                    const amount = (analysis.currentMonthSurplus * s.allocation) / 100;
                    return (
                      <div key={s.ticker} className="flex items-center justify-between bg-secondary rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <ArrowRight size={12} className="text-primary shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-foreground">{s.ticker}</p>
                            <p className="text-[10px] text-muted-foreground">{s.allocation}% of surplus</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-primary">${amount.toFixed(0)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-destructive mb-1">You're ${analysis.overspendAmount.toFixed(0)} over budget</p>
                <p className="text-xs text-muted-foreground">
                  Overspending now reduces what you can invest. Here are your top spending categories to review:
                </p>
              </div>
              {analysis.topCategories.map(([cat, amount]) => (
                <div key={cat} className="flex items-center justify-between bg-secondary rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <TrendingDown size={12} className="text-destructive shrink-0" />
                    <p className="text-xs font-medium text-foreground">{cat}</p>
                  </div>
                  <p className="text-xs font-bold text-destructive">${amount.toFixed(0)}</p>
                </div>
              ))}
            </>
          )}

          {/* Monthly investable */}
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Est. monthly investable</p>
              <p className="text-[10px] text-muted-foreground">after savings + expenses</p>
            </div>
            <p className="text-lg font-bold text-primary">${analysis.monthlyInvestable.toFixed(0)}<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
          </div>
        </div>
      )}

      {/* Savings overview */}
      {analysis.savingsAccounts.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <PiggyBank size={15} className="text-emerald-400" />
            <h3 className="text-foreground font-semibold text-sm">Savings Breakdown</h3>
            <span className="text-xs text-muted-foreground">(bi-weekly)</span>
          </div>
          <div className="space-y-2">
            {analysis.savingsAccounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between bg-secondary rounded-xl px-3 py-2.5">
                <p className="text-xs font-medium text-foreground">{acc.name}</p>
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-400">${acc.amountPerPaycheck.toLocaleString()}/paycheck</p>
                  <p className="text-[10px] text-muted-foreground">${(acc.amountPerPaycheck * 26).toLocaleString()}/year</p>
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between items-center">
              <p className="text-xs font-semibold text-foreground">Total annual savings</p>
              <p className="text-sm font-bold text-emerald-400">${analysis.annualSavings.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Growth projections */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <PieChart size={16} className="text-amber-400" />
          <h3 className="text-foreground font-semibold text-sm">Wealth Projections</h3>
          <span className="text-xs text-muted-foreground">(at 7% avg annual return)</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "10 Years", value: fv10, color: "text-primary" },
            { label: "20 Years", value: fv20, color: "text-amber-400" },
            { label: `${userProfile.investmentHorizonYears} Yrs (Goal)`, value: fvHorizon, color: "text-primary" },
          ].map((item) => (
            <div key={item.label} className="bg-muted rounded-xl p-3 text-center">
              <p className={`text-lg font-bold ${item.color}`}>
                {item.value >= 1_000_000
                  ? `$${(item.value / 1_000_000).toFixed(1)}M`
                  : item.value >= 1_000
                  ? `$${(item.value / 1_000).toFixed(0)}K`
                  : `$${item.value.toFixed(0)}`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Based on investing ${analysis.monthlyInvestable.toFixed(0)}/mo. Projections are estimates, not guarantees.
        </p>
      </div>

      {/* Portfolio */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <RiskIcon size={16} className="text-primary" />
          <h3 className="text-foreground font-semibold text-sm capitalize">
            {userProfile.riskTolerance} Portfolio — Suggested Allocation
          </h3>
        </div>
        <div className="space-y-2.5">
          {portfolio.map((s) => (
            <div key={s.ticker} className="bg-muted rounded-xl p-3">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold text-sm">{s.ticker}</span>
                    <RiskBadge risk={s.risk} />
                    <span className="text-xs text-muted-foreground">{s.type}</span>
                  </div>
                  <p className="text-xs text-foreground mt-0.5">{s.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-foreground font-bold text-sm">{s.allocation}%</p>
                  <p className="text-xs text-primary">{s.expectedReturn}/yr</p>
                  {analysis.monthlyInvestable > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      ${((analysis.monthlyInvestable * s.allocation) / 100).toFixed(0)}/mo
                    </p>
                  )}
                </div>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-primary rounded-full" style={{ width: `${s.allocation}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{s.rationale}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-border p-3 text-xs text-muted-foreground flex gap-2">
        <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-400" />
        <span>
          These suggestions are for educational purposes only. Consult a licensed financial advisor before investing. Past performance doesn't guarantee future results.
        </span>
      </div>
    </div>
  );
}
