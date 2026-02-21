import { useState } from "react";
import {
  DollarSign,
  Shield,
  Target,
  TrendingUp,
  ChevronRight,
  LogOut,
  Save,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { UserProfile } from "@/hooks/useAuth";

interface ProfileSettingsProps {
  user: UserProfile;
  onUpdate: (updates: Partial<Omit<UserProfile, "id" | "email" | "createdAt">>) => void;
  onLogout: () => void;
  onResetExpenses: () => void;
  expenseCount: number;
}

function NumInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block font-medium">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
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

type Section = "income" | "benefits" | "expenses" | "goals";

export function ProfileSettings({ user, onUpdate, onLogout, onResetExpenses, expenseCount }: ProfileSettingsProps) {
  const [openSection, setOpenSection] = useState<Section | null>(null);
  const [form, setForm] = useState({ ...user });
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const set = (key: keyof typeof form, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    onUpdate({
      grossMonthlyIncome: form.grossMonthlyIncome,
      netMonthlyIncome: form.netMonthlyIncome,
      health401kMonthly: form.health401kMonthly,
      otherPreTaxBenefits: form.otherPreTaxBenefits,
      rentMortgage: form.rentMortgage,
      carPayment: form.carPayment,
      insurancePremiums: form.insurancePremiums,
      subscriptions: form.subscriptions,
      otherFixedExpenses: form.otherFixedExpenses,
      savingsGoalPercent: form.savingsGoalPercent,
      investmentGoal: form.investmentGoal,
      riskTolerance: form.riskTolerance,
      investmentHorizonYears: form.investmentHorizonYears,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const fixedTotal = form.rentMortgage + form.carPayment + form.insurancePremiums + form.subscriptions + form.otherFixedExpenses;
  const disposable = form.netMonthlyIncome - fixedTotal;

  const SECTIONS: { id: Section; label: string; icon: typeof DollarSign; summary: string }[] = [
    {
      id: "income",
      label: "Income",
      icon: DollarSign,
      summary: `$${form.grossMonthlyIncome.toLocaleString()}/mo gross · $${form.netMonthlyIncome.toLocaleString()}/mo net`,
    },
    {
      id: "benefits",
      label: "Pre-Tax Benefits",
      icon: Shield,
      summary: `$${(form.health401kMonthly + form.otherPreTaxBenefits).toLocaleString()}/mo`,
    },
    {
      id: "expenses",
      label: "Fixed Expenses",
      icon: Target,
      summary: `$${fixedTotal.toLocaleString()}/mo · $${Math.max(0, disposable).toLocaleString()} disposable`,
    },
    {
      id: "goals",
      label: "Goals & Risk",
      icon: TrendingUp,
      summary: `${form.savingsGoalPercent}% savings · ${form.riskTolerance} risk · ${form.investmentHorizonYears}yr`,
    },
  ];

  return (
    <div className="space-y-4 max-w-lg">
      {/* User info card */}
      <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-destructive border border-border hover:border-destructive/30 text-xs font-medium transition-colors"
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>

      {/* Accordion sections */}
      {SECTIONS.map(({ id, label, icon: Icon, summary }) => (
        <div key={id} className="glass-card rounded-2xl overflow-hidden">
          <button
            onClick={() => setOpenSection(openSection === id ? null : id)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon size={15} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground truncate">{summary}</p>
            </div>
            <ChevronRight
              size={16}
              className={`text-muted-foreground transition-transform ${openSection === id ? "rotate-90" : ""}`}
            />
          </button>

          {openSection === id && (
            <div className="px-4 pb-4 border-t border-border space-y-3 pt-3">
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
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                      Savings Goal: <span className="text-primary font-bold">{form.savingsGoalPercent}%</span>
                    </label>
                    <input type="range" min={0} max={60} value={form.savingsGoalPercent} onChange={(e) => set("savingsGoalPercent", Number(e.target.value))} className="w-full accent-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Investment Goal</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["retirement", "property", "emergency", "growth"] as const).map((g) => (
                        <button key={g} onClick={() => set("investmentGoal", g)} className={`py-2 rounded-lg text-xs font-medium border transition-all capitalize ${form.investmentGoal === g ? "bg-primary/20 border-primary text-primary" : "bg-muted border-border text-muted-foreground"}`}>
                          {g === "retirement" ? "🏖 Retirement" : g === "property" ? "🏠 Property" : g === "emergency" ? "🛡 Emergency" : "📈 Growth"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Risk Tolerance</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["conservative", "moderate", "aggressive"] as const).map((r) => (
                        <button key={r} onClick={() => set("riskTolerance", r)} className={`py-2 rounded-lg text-xs font-medium border transition-all ${form.riskTolerance === r ? "bg-primary/20 border-primary text-primary" : "bg-muted border-border text-muted-foreground"}`}>
                          {r === "conservative" ? "🛡 Safe" : r === "moderate" ? "⚖ Balanced" : "🚀 Growth"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                      Investment Horizon: <span className="text-primary font-bold">{form.investmentHorizonYears} years</span>
                    </label>
                    <input type="range" min={1} max={40} value={form.investmentHorizonYears} onChange={(e) => set("investmentHorizonYears", Number(e.target.value))} className="w-full accent-primary" />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Save button */}
      <button
        onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
          saved
            ? "bg-primary/20 text-primary border border-primary/30"
            : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        <Save size={16} />
        {saved ? "Changes Saved ✓" : "Save Changes"}
      </button>
      {/* Reset all data */}
      <div className="glass-card rounded-2xl p-4 border border-destructive/20 space-y-3">
        <div className="flex items-center gap-2">
          <Trash2 size={15} className="text-destructive" />
          <span className="text-sm font-semibold text-foreground">Reset All Expenses</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Permanently delete all {expenseCount} expense{expenseCount !== 1 ? "s" : ""} and start fresh. This cannot be undone.
        </p>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={expenseCount === 0}
            className="w-full py-2.5 rounded-xl text-sm font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Reset Everything
          </button>
        ) : (
          <div className="space-y-2 p-3 bg-destructive/5 rounded-xl border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={14} />
              <span className="text-xs font-semibold">Are you absolutely sure?</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This will delete all {expenseCount} transactions, charts, and trends permanently.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onResetExpenses();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2 rounded-lg text-xs font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-colors"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
