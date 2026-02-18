import { useState } from "react";
import {
  DollarSign,
  Shield,
  Target,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { UserProfile } from "@/hooks/useAuth";

type WizardProfile = Omit<UserProfile, "id" | "email" | "name" | "createdAt">;

interface OnboardingWizardProps {
  userName: string;
  onComplete: (profile: WizardProfile) => void;
}

const STEPS = [
  { id: "income", label: "Income", icon: DollarSign },
  { id: "benefits", label: "Benefits", icon: Shield },
  { id: "expenses", label: "Fixed Expenses", icon: Target },
  { id: "goals", label: "Goals", icon: TrendingUp },
];

function NumInput({
  label,
  hint,
  value,
  onChange,
  prefix = "$",
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block font-medium">{label}</label>
      {hint && <p className="text-xs text-muted-foreground/70 mb-1.5">{hint}</p>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>
        <input
          type="number"
          min={0}
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="w-full bg-muted border border-border rounded-lg pl-7 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  );
}

export function OnboardingWizard({ userName, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardProfile>({
    grossMonthlyIncome: 0,
    netMonthlyIncome: 0,
    health401kMonthly: 0,
    otherPreTaxBenefits: 0,
    rentMortgage: 0,
    carPayment: 0,
    insurancePremiums: 0,
    subscriptions: 0,
    otherFixedExpenses: 0,
    savingsGoalPercent: 20,
    investmentGoal: "retirement",
    riskTolerance: "moderate",
    investmentHorizonYears: 20,
  });

  const set = (key: keyof WizardProfile, value: unknown) =>
    setData((d) => ({ ...d, [key]: value }));

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else onComplete(data);
  };
  const back = () => setStep((s) => s - 1);

  const firstName = userName.split(" ")[0];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 animate-in-up">
          <h2 className="text-2xl font-bold text-foreground">
            Welcome, <span className="text-gradient-primary">{firstName}!</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Let's set up your financial profile (takes ~2 mins)
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-between mb-6 px-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      done
                        ? "bg-primary text-primary-foreground"
                        : active
                        ? "bg-primary/20 border-2 border-primary text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <Check size={15} /> : <Icon size={15} />}
                  </div>
                  <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 mx-2 mb-4 ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-6 space-y-4 animate-in-up" style={{ animationDelay: "60ms" }}>
          {step === 0 && (
            <>
              <h3 className="text-foreground font-semibold text-base">Monthly Income</h3>
              <NumInput
                label="Gross Monthly Income (before taxes)"
                hint="Your total salary ÷ 12"
                value={data.grossMonthlyIncome}
                onChange={(v) => set("grossMonthlyIncome", v)}
              />
              <NumInput
                label="Net Monthly Income (take-home pay)"
                hint="What hits your bank account each month"
                value={data.netMonthlyIncome}
                onChange={(v) => set("netMonthlyIncome", v)}
              />
            </>
          )}

          {step === 1 && (
            <>
              <h3 className="text-foreground font-semibold text-base">Pre-Tax Benefits</h3>
              <NumInput
                label="Health Insurance + 401(k) Monthly Contribution"
                hint="Total deducted before you receive pay"
                value={data.health401kMonthly}
                onChange={(v) => set("health401kMonthly", v)}
              />
              <NumInput
                label="Other Pre-Tax Benefits (FSA, HSA, etc.)"
                value={data.otherPreTaxBenefits}
                onChange={(v) => set("otherPreTaxBenefits", v)}
              />
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-foreground font-semibold text-base">Fixed Monthly Expenses</h3>
              <NumInput label="Rent / Mortgage" value={data.rentMortgage} onChange={(v) => set("rentMortgage", v)} />
              <NumInput label="Car Payment" value={data.carPayment} onChange={(v) => set("carPayment", v)} />
              <NumInput label="Insurance Premiums" value={data.insurancePremiums} onChange={(v) => set("insurancePremiums", v)} />
              <NumInput label="Subscriptions (streaming, gym, etc.)" value={data.subscriptions} onChange={(v) => set("subscriptions", v)} />
              <NumInput label="Other Fixed Expenses" value={data.otherFixedExpenses} onChange={(v) => set("otherFixedExpenses", v)} />
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="text-foreground font-semibold text-base">Investment Goals & Risk</h3>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                  Savings Goal (% of net income)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={60}
                    value={data.savingsGoalPercent}
                    onChange={(e) => set("savingsGoalPercent", Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-primary font-bold text-sm w-10 text-right">{data.savingsGoalPercent}%</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Primary Investment Goal</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["retirement", "property", "emergency", "growth"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => set("investmentGoal", g)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all capitalize ${
                        data.investmentGoal === g
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-muted border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {g === "retirement" ? "🏖 Retirement" : g === "property" ? "🏠 Property" : g === "emergency" ? "🛡 Emergency" : "📈 Growth"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Risk Tolerance</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["conservative", "moderate", "aggressive"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => set("riskTolerance", r)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all capitalize ${
                        data.riskTolerance === r
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-muted border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r === "conservative" ? "🛡 Safe" : r === "moderate" ? "⚖ Balanced" : "🚀 Growth"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                  Investment Horizon: <span className="text-primary font-bold">{data.investmentHorizonYears} years</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={data.investmentHorizonYears}
                  onChange={(e) => set("investmentHorizonYears", Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                  <span>1 yr</span>
                  <span>40 yrs</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-4">
          {step > 0 && (
            <button
              onClick={back}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <button
            onClick={next}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-primary-foreground font-semibold py-2.5 rounded-xl transition-all text-sm"
          >
            {step === STEPS.length - 1 ? (
              <>
                <Check size={16} /> Complete Setup
              </>
            ) : (
              <>
                Next <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-3">
          You can always update these in your profile settings
        </p>
      </div>
    </div>
  );
}
