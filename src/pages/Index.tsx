import { useState } from "react";
import {
  Wallet,
  TrendingUp,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LineChart,
  Settings,
  LogOut,
  CreditCard,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/StatCard";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { SpendingChart } from "@/components/SpendingChart";
import { AIInsights } from "@/components/AIInsights";
import { AIChat } from "@/components/AIChat";
import { AuthPage } from "@/components/AuthPage";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { InvestmentSuggestions } from "@/components/InvestmentSuggestions";
import { ProfileSettings } from "@/components/ProfileSettings";
import { CreditCardHub } from "@/components/CreditCardHub";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Tab = "dashboard" | "investments" | "cards" | "settings";

export default function Index() {
  const { user, isLoggedIn, login, signup, logout, updateProfile, resetPassword } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { expenses, addExpense, deleteExpense, resetExpenses, getMonthExpenses, getTotalByCategory } =
    useExpenses(user?.id);

  // ---- Auth gates ----
  if (!isLoggedIn) {
    return <AuthPage onLogin={login} onSignup={signup} onResetPassword={resetPassword} />;
  }

  // Onboarding: if net income not set yet
  if (user && user.netMonthlyIncome === 0) {
    return (
      <OnboardingWizard
        userName={user.name}
        onComplete={(profile) => updateProfile(profile)}
      />
    );
  }

  const monthExpenses = getMonthExpenses(year, month);
  const totalByCategory = getTotalByCategory(monthExpenses);
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevExpenses = getMonthExpenses(prevYear, prevMonth);
  const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);
  const trend = prevTotal > 0 ? ((monthTotal - prevTotal) / prevTotal) * 100 : 0;

  const topCategory = Object.entries(totalByCategory).sort(([, a], [, b]) => b - a)[0];
  const uniqueDays = new Set(monthExpenses.map((e) => e.date)).size;
  const avgDaily = uniqueDays > 0 ? monthTotal / uniqueDays : 0;

  const goBack = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const goForward = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const handleLogoutRequest = () => setShowLogoutConfirm(true);

  const NAV_ITEMS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "investments", label: "Invest", icon: LineChart },
    { id: "cards", label: "Cards", icon: CreditCard },
    { id: "settings", label: "Profile", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      {/* Logout Confirmation Overlay */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-xs space-y-4 animate-in-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Sign Out?</p>
                <p className="text-xs text-muted-foreground">Your data is saved locally</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              You can sign back in anytime with the same email and password to access your expenses and settings.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { logout(); setShowLogoutConfirm(false); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center pulse-glow">
              <TrendingUp size={14} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-lg tracking-tight">
              Wealth<span className="text-gradient-primary">Wise</span>
            </span>
          </div>

          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === id
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {activeTab === "dashboard" && (
              <>
                <button onClick={goBack} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary min-w-[130px] justify-center">
                  <CalendarDays size={13} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{MONTH_NAMES[month - 1].slice(0, 3)} {year}</span>
                </div>
                <button
                  onClick={goForward}
                  disabled={isCurrentMonth}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
            <button
              onClick={handleLogoutRequest}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors text-sm"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Hey, <span className="text-gradient-primary">{user?.name.split(" ")[0]}</span> 👋
              </h1>
              <p className="text-sm text-muted-foreground">
                {MONTH_NAMES[month - 1]} {year} spending overview
              </p>
            </div>

            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-6 animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles size={36} className="text-primary" />
                </div>
                <div className="text-center space-y-1.5 max-w-xs">
                  <h2 className="text-lg font-bold text-foreground">Your dashboard is ready</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Start logging your first expense and your charts, insights, and spending overview will appear here automatically.
                  </p>
                </div>
                <div className="glass-card border border-primary/20 rounded-xl p-5 w-full max-w-sm space-y-3">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">Quick tips to get started</p>
                  <div className="space-y-2">
                    {[
                      { icon: "💬", text: "Ask the AI assistant to log an expense for you" },
                      { icon: "🎙️", text: 'Say "Add $12 lunch" via voice input' },
                      { icon: "✏️", text: "Use the form below to add your first transaction" },
                    ].map((tip) => (
                      <div key={tip.text} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <span className="text-base leading-snug">{tip.icon}</span>
                        <span>{tip.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-full max-w-sm">
                  <ExpenseForm onAdd={addExpense} />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard title="Month Total" value={`$${monthTotal.toFixed(2)}`} trend={trend} icon={<Wallet size={16} />} variant="primary" delay={0} />
                  <StatCard title="Daily Average" value={`$${avgDaily.toFixed(2)}`} subtitle={`${uniqueDays} active days`} icon={<BarChart3 size={16} />} variant="default" delay={80} />
                  <StatCard title="Top Category" value={topCategory ? `$${topCategory[1].toFixed(0)}` : "$0"} subtitle={topCategory ? topCategory[0] : "—"} icon={<TrendingUp size={16} />} variant="gold" delay={160} />
                  <StatCard title="Transactions" value={String(monthExpenses.length)} subtitle={`${prevExpenses.length} last month`} icon={<CalendarDays size={16} />} variant="default" delay={240} />
                </div>

                {user && user.netMonthlyIncome > 0 && (() => {
                  const fixedExpenses = user.rentMortgage + user.carPayment + user.insurancePremiums + user.subscriptions + user.otherFixedExpenses;
                  const disposable = user.netMonthlyIncome - fixedExpenses;
                  const pct = Math.min(100, (monthTotal / disposable) * 100);
                  const savingsTarget = (user.savingsGoalPercent / 100) * user.netMonthlyIncome;
                  const investable = Math.max(0, disposable - monthTotal - savingsTarget * 0.5);
                  return (
                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Monthly Budget</span>
                        <span className={`text-xs font-medium ${pct > 90 ? "text-destructive" : pct > 70 ? "text-accent" : "text-primary"}`}>
                          ${monthTotal.toFixed(0)} / ${disposable.toFixed(0)} disposable
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct > 90 ? "bg-destructive" : pct > 70 ? "bg-accent" : "bg-primary"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                        <span>💰 Investable this month: <strong className="text-primary">${investable.toFixed(0)}</strong></span>
                        <span>{pct.toFixed(0)}% used</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1 space-y-4">
                    <ExpenseForm onAdd={addExpense} />
                    <ExpenseList expenses={monthExpenses} onDelete={deleteExpense} />
                  </div>
                  <div className="lg:col-span-2 space-y-4">
                    <SpendingChart expenses={expenses} totalByCategory={totalByCategory} />
                    <AIInsights expenses={monthExpenses} totalByCategory={totalByCategory} monthTotal={monthTotal} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "investments" && user && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Investment <span className="text-gradient-primary">Suggestions</span>
              </h1>
              <p className="text-sm text-muted-foreground">Personalized based on your spending trends & goals</p>
            </div>
            <InvestmentSuggestions expenses={expenses} userProfile={user} />
          </div>
        )}

        {activeTab === "cards" && user && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Credit Card <span className="text-gradient-gold">Hub</span>
              </h1>
              <p className="text-sm text-muted-foreground">Maximize rewards · track utilization · find your next card</p>
            </div>
            <CreditCardHub expenses={expenses} userProfile={user} />
          </div>
        )}

        {activeTab === "settings" && user && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Financial <span className="text-gradient-primary">Profile</span>
              </h1>
              <p className="text-sm text-muted-foreground">Update your income, expenses & investment goals</p>
            </div>
            <ProfileSettings user={user} onUpdate={updateProfile} onLogout={handleLogoutRequest} onResetExpenses={resetExpenses} expenseCount={expenses.length} />
          </div>
        )}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-around px-2 py-2 safe-bottom">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-colors ${
                activeTab === id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* AI Chat FAB */}
      {user && (
        <AIChat
          expenses={expenses}
          userProfile={user}
          onAddExpense={addExpense}
        />
      )}
    </div>
  );
}
