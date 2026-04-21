import { useState } from "react";
import { DollarSign, Shield, Target, TrendingUp, ChevronRight, ChevronLeft, Check, Zap, PiggyBank, Trash2, Plus } from "lucide-react";
import { UserProfile, SavingsAccount } from "@/hooks/useAuth";

type WizardProfile = Omit<UserProfile, "id" | "email" | "name" | "createdAt">;

interface OnboardingWizardProps {
  userName: string;
  onComplete: (profile: WizardProfile) => void | Promise<void>;
}

const STEPS = [
  { id: "income",   label: "Income",   icon: DollarSign,  color: "text-primary",    bg: "bg-primary/15"   },
  { id: "benefits", label: "Benefits", icon: Shield,      color: "text-violet-400", bg: "bg-violet-400/15" },
  { id: "expenses", label: "Fixed",    icon: Target,      color: "text-amber-400",  bg: "bg-amber-400/15"  },
  { id: "goals",    label: "Goals",    icon: TrendingUp,  color: "text-primary",    bg: "bg-primary/15"    },
  { id: "paycheck", label: "Paycheck", icon: PiggyBank,   color: "text-emerald-400", bg: "bg-emerald-400/15" },
];

function NumInput({ label, hint, value, onChange }: {
  label: string; hint?: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block font-medium">{label}</label>
      {hint && <p className="text-[11px] text-muted-foreground/60 mb-1.5">{hint}</p>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">$</span>
        <input
          type="number" min={0} value={value || ""} placeholder="0"
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-secondary border border-border rounded-xl pl-8 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 font-mono transition-all"
        />
      </div>
    </div>
  );
}

export function OnboardingWizard({ userName, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Omit<WizardProfile, "paychecks" | "savingsAccounts">>({
    grossMonthlyIncome: 0, netMonthlyIncome: 0, health401kMonthly: 0,
    otherPreTaxBenefits: 0, rentMortgage: 0, carPayment: 0,
    insurancePremiums: 0, subscriptions: 0, otherFixedExpenses: 0,
    savingsGoalPercent: 20, investmentGoal: "retirement",
    riskTolerance: "moderate", investmentHorizonYears: 20,
  });

  const [paycheckAmount, setPaycheckAmount] = useState(0);
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([
    { id: crypto.randomUUID(), name: "Amex Savings", amountPerPaycheck: 300 },
    { id: crypto.randomUUID(), name: "DCU", amountPerPaycheck: 500 },
  ]);

  const set = (key: keyof typeof data, value: unknown) => setData((d) => ({ ...d, [key]: value }));

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      const today = new Date().toISOString().split("T")[0];
      const paychecks = paycheckAmount > 0
        ? [{ id: crypto.randomUUID(), amount: paycheckAmount, date: today }]
        : [];
      onComplete({ ...data, paychecks, savingsAccounts });
    }
  };
  const back = () => setStep((s) => s - 1);
  const firstName = userName.split(" ")[0];

  const totalSavingsPerPaycheck = savingsAccounts.reduce((s, a) => s + a.amountPerPaycheck, 0);
  const expenseLimit = paycheckAmount - totalSavingsPerPaycheck;

  const addSavingsAccount = () =>
    setSavingsAccounts((a) => [...a, { id: crypto.randomUUID(), name: "", amountPerPaycheck: 0 }]);

  const updateAccount = (id: string, key: keyof SavingsAccount, value: string | number) =>
    setSavingsAccounts((a) => a.map((acc) => acc.id === id ? { ...acc, [key]: value } : acc));

  const removeAccount = (id: string) =>
    setSavingsAccounts((a) => a.filter((acc) => acc.id !== id));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4"
      style={{backgroundImage:"radial-gradient(ellipse 70% 50% at 50% -10%, hsl(185 100% 50% / 0.05) 0%, transparent 70%)"}}>
      <div className="w-full max-w-md">

        {/* Logo + heading */}
        <div className="text-center mb-7 animate-in-up">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center pulse-glow"
            style={{background:"linear-gradient(135deg,hsl(185,100%,40%),hsl(195,100%,55%))"}}>
            <Zap size={22} className="text-black" />
          </div>
          <h2 className="text-2xl font-bold" style={{fontFamily:"'Syne',sans-serif"}}>
            Welcome, <span className="text-gradient-primary">{firstName}!</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Set up your financial profile — takes about 2 minutes</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between mb-6 px-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1 relative">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                    done ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(185,100%,50%,0.4)]"
                    : active ? `${s.bg} border-2 border-current ${s.color}`
                    : "bg-secondary text-muted-foreground border border-border"
                  }`}>
                    {done ? <Check size={14} /> : <Icon size={14} />}
                  </div>
                  <span className={`text-[9px] font-semibold uppercase tracking-wide ${active ? s.color : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-1 mb-5 transition-colors duration-500"
                    style={{background: i < step ? "hsl(185,100%,50%)" : "hsl(240,6%,13%)"}} />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-secondary rounded-full mb-5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{width:`${((step+1)/STEPS.length)*100}%`, background:"linear-gradient(90deg,hsl(185,100%,40%),hsl(195,100%,55%))"}} />
        </div>

        {/* Card */}
        <div className="glass-cyan rounded-2xl p-6 space-y-4 animate-in-up" style={{animationDelay:"60ms"}}>

          {step === 0 && (
            <>
              <h3 className="font-bold text-base" style={{fontFamily:"'Syne',sans-serif"}}>Monthly Income</h3>
              <NumInput label="Gross Monthly Income (before taxes)" hint="Your total salary ÷ 12" value={data.grossMonthlyIncome} onChange={(v) => set("grossMonthlyIncome", v)} />
              <NumInput label="Net Monthly Income (take-home)" hint="What actually hits your bank account" value={data.netMonthlyIncome} onChange={(v) => set("netMonthlyIncome", v)} />
            </>
          )}

          {step === 1 && (
            <>
              <h3 className="font-bold text-base" style={{fontFamily:"'Syne',sans-serif"}}>Pre-Tax Benefits</h3>
              <NumInput label="Health Insurance + 401(k) contribution" hint="Total deducted before you receive pay" value={data.health401kMonthly} onChange={(v) => set("health401kMonthly", v)} />
              <NumInput label="Other Pre-Tax Benefits (FSA, HSA, etc.)" value={data.otherPreTaxBenefits} onChange={(v) => set("otherPreTaxBenefits", v)} />
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="font-bold text-base" style={{fontFamily:"'Syne',sans-serif"}}>Fixed Monthly Expenses</h3>
              <NumInput label="Rent / Mortgage" value={data.rentMortgage} onChange={(v) => set("rentMortgage", v)} />
              <NumInput label="Car Payment" value={data.carPayment} onChange={(v) => set("carPayment", v)} />
              <NumInput label="Insurance Premiums" value={data.insurancePremiums} onChange={(v) => set("insurancePremiums", v)} />
              <NumInput label="Subscriptions (streaming, gym, etc.)" value={data.subscriptions} onChange={(v) => set("subscriptions", v)} />
              <NumInput label="Other Fixed Expenses" value={data.otherFixedExpenses} onChange={(v) => set("otherFixedExpenses", v)} />
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="font-bold text-base" style={{fontFamily:"'Syne',sans-serif"}}>Investment Goals & Risk</h3>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block font-medium">
                  Savings Goal — <span className="text-primary font-bold">{data.savingsGoalPercent}% of net income</span>
                </label>
                <input type="range" min={0} max={60} value={data.savingsGoalPercent}
                  onChange={(e) => set("savingsGoalPercent", Number(e.target.value))}
                  className="w-full accent-primary h-1.5" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>0%</span><span>60%</span></div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block font-medium">Primary Investment Goal</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["retirement","property","emergency","growth"] as const).map((g) => (
                    <button key={g} onClick={() => set("investmentGoal", g)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all ${
                        data.investmentGoal === g ? "bg-primary/15 border-primary/40 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                      }`}>
                      {g === "retirement" ? "🏖 Retirement" : g === "property" ? "🏠 Property" : g === "emergency" ? "🛡 Emergency" : "📈 Growth"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block font-medium">Risk Tolerance</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["conservative","moderate","aggressive"] as const).map((r) => (
                    <button key={r} onClick={() => set("riskTolerance", r)}
                      className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${
                        data.riskTolerance === r ? "bg-primary/15 border-primary/40 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                      }`}>
                      {r === "conservative" ? "🛡 Safe" : r === "moderate" ? "⚖ Balanced" : "🚀 Growth"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block font-medium">
                  Investment Horizon — <span className="text-primary font-bold">{data.investmentHorizonYears} years</span>
                </label>
                <input type="range" min={1} max={40} value={data.investmentHorizonYears}
                  onChange={(e) => set("investmentHorizonYears", Number(e.target.value))}
                  className="w-full accent-primary h-1.5" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>1 yr</span><span>40 yrs</span></div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h3 className="font-bold text-base" style={{fontFamily:"'Syne',sans-serif"}}>Paycheck & Savings</h3>
              <p className="text-xs text-muted-foreground -mt-1">You're paid bi-weekly. We'll prompt you to update each paycheck.</p>

              <NumInput
                label="Most recent paycheck amount (take-home)"
                hint="What hit your checking account this pay period"
                value={paycheckAmount}
                onChange={setPaycheckAmount}
              />

              {/* Savings accounts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground font-medium">Savings deducted each paycheck</label>
                  <button type="button" onClick={addSavingsAccount}
                    className="flex items-center gap-1 text-[11px] text-primary font-medium">
                    <Plus size={11} /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {savingsAccounts.map((acc) => (
                    <div key={acc.id} className="flex gap-2 items-center">
                      <input
                        className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Account name"
                        value={acc.name}
                        onChange={(e) => updateAccount(acc.id, "name", e.target.value)}
                      />
                      <div className="relative w-24 shrink-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">$</span>
                        <input
                          type="number" min={0}
                          className="w-full bg-secondary border border-border rounded-xl pl-7 pr-2 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="0"
                          value={acc.amountPerPaycheck || ""}
                          onChange={(e) => updateAccount(acc.id, "amountPerPaycheck", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <button type="button" onClick={() => removeAccount(acc.id)}
                        className="text-muted-foreground hover:text-destructive p-1 shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live preview */}
              {paycheckAmount > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-primary">Per-paycheck breakdown</p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Paycheck</span>
                    <span className="font-mono text-foreground">${paycheckAmount.toLocaleString()}</span>
                  </div>
                  {savingsAccounts.map((acc) => acc.amountPerPaycheck > 0 && (
                    <div key={acc.id} className="flex justify-between text-xs text-muted-foreground">
                      <span>→ {acc.name || "Savings"}</span>
                      <span className="font-mono text-amber-400">−${acc.amountPerPaycheck.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-1.5 flex justify-between text-xs font-semibold">
                    <span>Expense limit / paycheck</span>
                    <span className={`font-mono ${expenseLimit >= 0 ? "text-primary" : "text-destructive"}`}>
                      ${Math.max(0, expenseLimit).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Monthly ≈ ${Math.max(0, expenseLimit * 2).toLocaleString()} (2 paychecks)
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Nav buttons */}
        <div className="flex gap-3 mt-4">
          {step > 0 && (
            <button onClick={back}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-secondary border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft size={15} /> Back
            </button>
          )}
          <button onClick={next}
            className="flex-1 flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all text-sm text-black"
            style={{background:"linear-gradient(135deg,hsl(185,100%,40%),hsl(195,100%,55%))"}}>
            {step === STEPS.length - 1 ? <><Check size={15} /> Complete Setup</> : <>Next <ChevronRight size={15} /></>}
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-3">You can always update these in Profile settings</p>
      </div>
    </div>
  );
}
