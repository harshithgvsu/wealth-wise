import { useState } from "react";
import { DollarSign, Shield, Target, TrendingUp, ChevronRight, LogOut, Save, Trash2, AlertTriangle, User } from "lucide-react";
import { UserProfile } from "@/hooks/useAuth";

interface ProfileSettingsProps {
  user: UserProfile;
  onUpdate: (updates: Partial<Omit<UserProfile, "id" | "email" | "createdAt">>) => void;
  onLogout: () => void;
  onResetExpenses: () => void;
  expenseCount: number;
}

function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block font-medium">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">$</span>
        <input type="number" min={0} value={value || ""} placeholder="0"
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-secondary border border-border rounded-xl pl-8 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 font-mono transition-all" />
      </div>
    </div>
  );
}

type Section = "income" | "benefits" | "expenses" | "goals";

const SECTION_META: { id: Section; label: string; icon: typeof DollarSign; accent: string }[] = [
  { id: "income",   label: "Income",           icon: DollarSign, accent: "text-primary bg-primary/15" },
  { id: "benefits", label: "Pre-Tax Benefits",  icon: Shield,     accent: "text-violet-400 bg-violet-400/15" },
  { id: "expenses", label: "Fixed Expenses",    icon: Target,     accent: "text-amber-400 bg-amber-400/15" },
  { id: "goals",    label: "Goals & Risk",      icon: TrendingUp, accent: "text-primary bg-primary/15" },
];

export function ProfileSettings({ user, onUpdate, onLogout, onResetExpenses, expenseCount }: ProfileSettingsProps) {
  const [openSection, setOpenSection] = useState<Section | null>(null);
  const [form, setForm] = useState({ ...user });
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const set = (key: keyof typeof form, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    onUpdate({
      grossMonthlyIncome: form.grossMonthlyIncome, netMonthlyIncome: form.netMonthlyIncome,
      health401kMonthly: form.health401kMonthly, otherPreTaxBenefits: form.otherPreTaxBenefits,
      rentMortgage: form.rentMortgage, carPayment: form.carPayment,
      insurancePremiums: form.insurancePremiums, subscriptions: form.subscriptions,
      otherFixedExpenses: form.otherFixedExpenses, savingsGoalPercent: form.savingsGoalPercent,
      investmentGoal: form.investmentGoal, riskTolerance: form.riskTolerance,
      investmentHorizonYears: form.investmentHorizonYears,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const fixedTotal = form.rentMortgage + form.carPayment + form.insurancePremiums + form.subscriptions + form.otherFixedExpenses;
  const disposable = form.netMonthlyIncome - fixedTotal;

  const summaries: Record<Section, string> = {
    income:   `$${form.grossMonthlyIncome.toLocaleString()}/mo gross · $${form.netMonthlyIncome.toLocaleString()}/mo net`,
    benefits: `$${(form.health401kMonthly + form.otherPreTaxBenefits).toLocaleString()}/mo pre-tax`,
    expenses: `$${fixedTotal.toLocaleString()}/mo · $${Math.max(0, disposable).toLocaleString()} disposable`,
    goals:    `${form.savingsGoalPercent}% savings · ${form.riskTolerance} · ${form.investmentHorizonYears}yr`,
  };

  return (
    <div className="space-y-4 max-w-lg">

      {/* User card */}
      <div className="glass-cyan rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-lg font-bold text-primary shadow-[0_0_16px_hsl(185,100%,50%,0.15)]"
          style={{fontFamily:"'Syne',sans-serif"}}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate" style={{fontFamily:"'Syne',sans-serif"}}>{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <button onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-destructive border border-border hover:border-destructive/30 text-xs font-medium transition-colors">
          <LogOut size={12} /> Sign Out
        </button>
      </div>

      {/* Accordion sections */}
      {SECTION_META.map(({ id, label, icon: Icon, accent }) => (
        <div key={id} className="glass rounded-2xl overflow-hidden border border-border">
          <button
            onClick={() => setOpenSection(openSection === id ? null : id)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-secondary/40 transition-colors">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{fontFamily:"'Syne',sans-serif"}}>{label}</p>
              <p className="text-xs text-muted-foreground truncate">{summaries[id]}</p>
            </div>
            <ChevronRight size={15} className={`text-muted-foreground transition-transform duration-200 ${openSection === id ? "rotate-90" : ""}`} />
          </button>

          {openSection === id && (
            <div className="px-4 pb-4 border-t border-border space-y-3 pt-3 animate-in-up">
              {id === "income" && (
                <>
                  <NumInput label="Gross Monthly Income" value={form.grossMonthlyIncome} onChange={(v) => set("grossMonthlyIncome", v)} />
                  <NumInput label="Net Monthly Income (take-home)" value={form.netMonthlyIncome} onChange={(v) => set("netMonthlyIncome", v)} />
                </>
              )}
              {id === "benefits" && (
                <>
                  <NumInput label="Health Insurance + 401(k)" value={form.health401kMonthly} onChange={(v) => set("health401kMonthly", v)} />
                  <NumInput label="Other Pre-Tax Benefits (FSA, HSA)" value={form.otherPreTaxBenefits} onChange={(v) => set("otherPreTaxBenefits", v)} />
                </>
              )}
              {id === "expenses" && (
                <>
                  <NumInput label="Rent / Mortgage" value={form.rentMortgage} onChange={(v) => set("rentMortgage", v)} />
                  <NumInput label="Car Payment" value={form.carPayment} onChange={(v) => set("carPayment", v)} />
                  <NumInput label="Insurance Premiums" value={form.insurancePremiums} onChange={(v) => set("insurancePremiums", v)} />
                  <NumInput label="Subscriptions" value={form.subscriptions} onChange={(v) => set("subscriptions", v)} />
                  <NumInput label="Other Fixed Expenses" value={form.otherFixedExpenses} onChange={(v) => set("otherFixedExpenses", v)} />
                </>
              )}
              {id === "goals" && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">
                      Savings Goal — <span className="text-primary font-bold">{form.savingsGoalPercent}%</span>
                    </label>
                    <input type="range" min={0} max={60} value={form.savingsGoalPercent}
                      onChange={(e) => set("savingsGoalPercent", Number(e.target.value))}
                      className="w-full accent-primary h-1.5" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">Investment Goal</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["retirement","property","emergency","growth"] as const).map((g) => (
                        <button key={g} onClick={() => set("investmentGoal", g)}
                          className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${
                            form.investmentGoal === g ? "bg-primary/15 border-primary/40 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
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
                            form.riskTolerance === r ? "bg-primary/15 border-primary/40 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                          }`}>
                          {r === "conservative" ? "🛡 Safe" : r === "moderate" ? "⚖ Balanced" : "🚀 Growth"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">
                      Horizon — <span className="text-primary font-bold">{form.investmentHorizonYears} yrs</span>
                    </label>
                    <input type="range" min={1} max={40} value={form.investmentHorizonYears}
                      onChange={(e) => set("investmentHorizonYears", Number(e.target.value))}
                      className="w-full accent-primary h-1.5" />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>1 yr</span><span>40 yrs</span></div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Save */}
      <button onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
          saved ? "bg-primary/15 text-primary border border-primary/30" : "text-black"
        }`}
        style={saved ? {} : {background:"linear-gradient(135deg,hsl(185,100%,40%),hsl(195,100%,55%))"}}>
        <Save size={14} />
        {saved ? "Changes Saved ✓" : "Save Changes"}
      </button>

      {/* Danger zone */}
      <div className="glass rounded-2xl p-4 border border-destructive/20 space-y-3">
        <div className="flex items-center gap-2">
          <Trash2 size={14} className="text-destructive" />
          <span className="text-sm font-bold text-foreground" style={{fontFamily:"'Syne',sans-serif"}}>Danger Zone</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Permanently delete all {expenseCount} expense{expenseCount !== 1 ? "s" : ""}. Cannot be undone.
        </p>
        {!showReset ? (
          <button onClick={() => setShowReset(true)} disabled={expenseCount === 0}
            className="w-full py-2.5 rounded-xl text-sm font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Reset All Expenses
          </button>
        ) : (
          <div className="space-y-2 p-3 bg-destructive/5 rounded-xl border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={13} />
              <span className="text-xs font-semibold">Are you absolutely sure?</span>
            </div>
            <p className="text-xs text-muted-foreground">This will delete all {expenseCount} transactions permanently.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowReset(false)}
                className="flex-1 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-secondary transition-colors">
                Cancel
              </button>
              <button onClick={() => { onResetExpenses(); setShowReset(false); }}
                className="flex-1 py-2 rounded-lg text-xs font-medium bg-destructive text-white hover:opacity-90 transition-colors">
                Yes, Delete All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
