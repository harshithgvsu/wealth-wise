import { useState } from "react";
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  Zap,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Gift,
} from "lucide-react";
import type { Expense } from "@/hooks/useExpenses";
import type { UserProfile } from "@/hooks/useAuth";

// ─── Preset Card Catalogue ───────────────────────────────────────────────────
interface PresetCard {
  id: string;
  name: string;
  issuer: string;
  network: "Visa" | "Mastercard" | "Amex" | "Discover";
  annualFee: number;
  signupBonus?: string;
  signupSpend?: number; // spend required for signup bonus
  rewards: { [category: string]: number }; // multiplier (e.g. 4 = 4x)
  baseReward: number; // catch-all multiplier
  rewardType: "points" | "cashback" | "miles";
  centsPerPoint: number; // to normalise to cash value
  color: string; // tailwind gradient class fragment (used inline)
  cardBg: string;
}

const PRESET_CARDS: PresetCard[] = [
  {
    id: "amex-gold",
    name: "Gold Card",
    issuer: "Amex",
    network: "Amex",
    annualFee: 250,
    signupBonus: "60,000 pts ($600)",
    signupSpend: 4000,
    rewards: { "Food & Dining": 4, Restaurant: 4, Groceries: 4, "Travel": 3 },
    baseReward: 1,
    rewardType: "points",
    centsPerPoint: 1.0,
    color: "#D4A843",
    cardBg: "from-yellow-700 via-yellow-600 to-yellow-400",
  },
  {
    id: "chase-sapphire-preferred",
    name: "Sapphire Preferred",
    issuer: "Chase",
    network: "Visa",
    annualFee: 95,
    signupBonus: "60,000 pts ($750 travel)",
    signupSpend: 4000,
    rewards: { Travel: 3, "Food & Dining": 3, Restaurant: 3, Streaming: 3 },
    baseReward: 1,
    rewardType: "points",
    centsPerPoint: 1.25,
    color: "#2A6FBF",
    cardBg: "from-blue-900 via-blue-800 to-blue-600",
  },
  {
    id: "chase-sapphire-reserve",
    name: "Sapphire Reserve",
    issuer: "Chase",
    network: "Visa",
    annualFee: 550,
    signupBonus: "60,000 pts ($900 travel)",
    signupSpend: 4000,
    rewards: { Travel: 10, "Food & Dining": 3, Restaurant: 3, "Gas": 3 },
    baseReward: 1,
    rewardType: "points",
    centsPerPoint: 1.5,
    color: "#1A1A2E",
    cardBg: "from-slate-900 via-slate-800 to-slate-700",
  },
  {
    id: "citi-double-cash",
    name: "Double Cash",
    issuer: "Citi",
    network: "Mastercard",
    annualFee: 0,
    rewards: {},
    baseReward: 2,
    rewardType: "cashback",
    centsPerPoint: 1,
    color: "#005792",
    cardBg: "from-sky-900 via-sky-800 to-sky-600",
  },
  {
    id: "amex-blue-cash-preferred",
    name: "Blue Cash Preferred",
    issuer: "Amex",
    network: "Amex",
    annualFee: 95,
    signupBonus: "$250 statement credit",
    signupSpend: 3000,
    rewards: { Groceries: 6, "Streaming": 6, "Gas": 3, Transit: 3 },
    baseReward: 1,
    rewardType: "cashback",
    centsPerPoint: 1,
    color: "#1A5276",
    cardBg: "from-blue-900 via-cyan-800 to-blue-500",
  },
  {
    id: "discover-it",
    name: "Discover it® Cash Back",
    issuer: "Discover",
    network: "Discover",
    annualFee: 0,
    signupBonus: "Cashback match first year",
    signupSpend: 0,
    rewards: { Groceries: 5, "Gas": 5, Restaurants: 5 },
    baseReward: 1,
    rewardType: "cashback",
    centsPerPoint: 1,
    color: "#F97316",
    cardBg: "from-orange-700 via-orange-600 to-orange-400",
  },
  {
    id: "venture-x",
    name: "Venture X",
    issuer: "Capital One",
    network: "Visa",
    annualFee: 395,
    signupBonus: "75,000 miles ($750 travel)",
    signupSpend: 4000,
    rewards: { Travel: 10, "Food & Dining": 2, Restaurant: 2 },
    baseReward: 2,
    rewardType: "miles",
    centsPerPoint: 1.0,
    color: "#C0392B",
    cardBg: "from-red-900 via-red-800 to-rose-600",
  },
  {
    id: "apple-card",
    name: "Apple Card",
    issuer: "Goldman Sachs",
    network: "Mastercard",
    annualFee: 0,
    rewards: { "Apple": 3 },
    baseReward: 1,
    rewardType: "cashback",
    centsPerPoint: 1,
    color: "#9CA3AF",
    cardBg: "from-gray-600 via-gray-400 to-white",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserCard {
  presetId?: string;
  name: string;
  issuer: string;
  network: string;
  annualFee: number;
  rewardType: "points" | "cashback" | "miles";
  baseReward: number;
  rewards: { [category: string]: number };
  centsPerPoint: number;
  cardBg: string;
  color: string;
  creditLimit?: number;
  currentBalance?: number;
  signupBonus?: string;
  signupSpend?: number;
  spentTowardBonus?: number;
  id: string;
}

const STORAGE_KEY = "wealthwise_cards";

function loadCards(): UserCard[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveCards(cards: UserCard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CATEGORY_MATCH: Record<string, string[]> = {
  "Food & Dining": ["food", "dining", "restaurant", "eat", "lunch", "dinner", "breakfast", "cafe", "coffee"],
  Groceries: ["grocery", "groceries", "supermarket", "market", "whole foods", "costco"],
  Travel: ["travel", "flight", "hotel", "airbnb", "uber", "lyft", "taxi", "airline", "air"],
  Gas: ["gas", "fuel", "shell", "chevron", "bp", "exxon"],
  Streaming: ["netflix", "spotify", "hulu", "disney", "streaming", "apple tv", "hbo"],
  Shopping: ["amazon", "shop", "store", "target", "walmart", "retail"],
  Entertainment: ["entertainment", "movie", "concert", "show", "ticket"],
};

function mapCategory(expenseCategory: string): string {
  const lower = expenseCategory.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_MATCH)) {
    if (keywords.some((k) => lower.includes(k))) return cat;
  }
  return expenseCategory;
}

function getCardRate(card: UserCard, category: string): number {
  const mapped = mapCategory(category);
  return card.rewards[mapped] ?? card.rewards[category] ?? card.baseReward;
}

function getEffectiveCashback(card: UserCard, category: string, amount: number): number {
  return (getCardRate(card, category) * card.centsPerPoint * amount) / 100;
}

function getBestCard(cards: UserCard[], category: string): UserCard | null {
  if (!cards.length) return null;
  return cards.reduce((best, card) =>
    getCardRate(card, category) * card.centsPerPoint >
    getCardRate(best, category) * best.centsPerPoint
      ? card
      : best
  );
}

// ─── Recommended Next Card ────────────────────────────────────────────────────
function recommendNextCard(
  owned: UserCard[],
  expenses: Expense[]
): { card: PresetCard; reason: string } | null {
  const ownedIds = new Set(owned.map((c) => c.presetId).filter(Boolean));
  const available = PRESET_CARDS.filter((c) => !ownedIds.has(c.id));
  if (!available.length) return null;

  // tally spend per mapped category
  const catTotals: Record<string, number> = {};
  for (const e of expenses) {
    const cat = mapCategory(e.category);
    catTotals[cat] = (catTotals[cat] || 0) + e.amount;
  }

  let best: PresetCard | null = null;
  let bestLift = -1;
  let bestReason = "";

  for (const preset of available) {
    let lift = 0;
    let topCat = "";
    let topLift = 0;
    for (const [cat, spend] of Object.entries(catTotals)) {
      const newRate = (preset.rewards[cat] ?? preset.baseReward) * preset.centsPerPoint;
      const currentBest = owned.length
        ? Math.max(...owned.map((c) => getCardRate(c, cat) * c.centsPerPoint))
        : 0;
      const catLift = ((newRate - currentBest) / 100) * spend;
      lift += catLift;
      if (catLift > topLift) { topLift = catLift; topCat = cat; }
    }
    // factor in annual fee (monthly cost)
    const netAnnualLift = lift * 12 - preset.annualFee;
    if (netAnnualLift > bestLift) {
      bestLift = netAnnualLift;
      best = preset;
      bestReason = topCat
        ? `Adds ${(preset.rewards[topCat] ?? preset.baseReward) * preset.centsPerPoint}% on ${topCat} — your biggest spend gap. Estimated +$${Math.max(0, netAnnualLift).toFixed(0)}/yr net of the $${preset.annualFee} annual fee.`
        : `Best overall cashback lift (+$${Math.max(0, netAnnualLift).toFixed(0)}/yr net).`;
    }
  }

  return best ? { card: best, reason: bestReason } : null;
}

// ─── Card Visual ──────────────────────────────────────────────────────────────
function CardVisual({ card, small = false }: { card: UserCard | PresetCard; small?: boolean }) {
  return (
    <div
      className={`relative rounded-xl bg-gradient-to-br ${card.cardBg} overflow-hidden ${
        small ? "h-16 w-28" : "h-40 w-full"
      } flex flex-col justify-between p-3 shadow-lg`}
    >
      <div className={`flex justify-between items-start ${small ? "text-[8px]" : "text-xs"} text-white/80`}>
        <span className="font-bold">{card.issuer}</span>
        <span>{card.network}</span>
      </div>
      {!small && (
        <>
          <div className="text-white/40 text-xs tracking-widest font-mono">•••• •••• •••• ••••</div>
          <div className="flex justify-between items-end">
            <span className="text-white text-xs font-medium truncate max-w-[70%]">{card.name}</span>
            <span className="text-white/70 text-[10px]">{card.rewardType}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Add Card Sheet ───────────────────────────────────────────────────────────
function AddCardSheet({
  onAdd,
  onClose,
}: {
  onAdd: (card: UserCard) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [selected, setSelected] = useState<PresetCard | null>(null);
  const [creditLimit, setCreditLimit] = useState("");
  const [balance, setBalance] = useState("");
  const [spentBonus, setSpentBonus] = useState("");

  // custom fields
  const [customName, setCustomName] = useState("");
  const [customIssuer, setCustomIssuer] = useState("");
  const [customFee, setCustomFee] = useState("0");
  const [customBase, setCustomBase] = useState("1");

  const handleAdd = () => {
    if (mode === "preset" && selected) {
      const card: UserCard = {
        id: crypto.randomUUID(),
        presetId: selected.id,
        name: selected.name,
        issuer: selected.issuer,
        network: selected.network,
        annualFee: selected.annualFee,
        rewardType: selected.rewardType,
        baseReward: selected.baseReward,
        rewards: selected.rewards,
        centsPerPoint: selected.centsPerPoint,
        cardBg: selected.cardBg,
        color: selected.color,
        creditLimit: creditLimit ? Number(creditLimit) : undefined,
        currentBalance: balance ? Number(balance) : undefined,
        signupBonus: selected.signupBonus,
        signupSpend: selected.signupSpend,
        spentTowardBonus: spentBonus ? Number(spentBonus) : 0,
      };
      onAdd(card);
    } else if (mode === "custom" && customName && customIssuer) {
      const card: UserCard = {
        id: crypto.randomUUID(),
        name: customName,
        issuer: customIssuer,
        network: "Visa",
        annualFee: Number(customFee) || 0,
        rewardType: "cashback",
        baseReward: Number(customBase) || 1,
        rewards: {},
        centsPerPoint: 1,
        cardBg: "from-emerald-900 via-emerald-800 to-emerald-600",
        color: "#10B981",
        creditLimit: creditLimit ? Number(creditLimit) : undefined,
        currentBalance: balance ? Number(balance) : undefined,
      };
      onAdd(card);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-foreground mb-4">Add a Credit Card</h2>

        {/* Mode toggle */}
        <div className="flex bg-secondary rounded-xl p-1 mb-4 gap-1">
          {(["preset", "custom"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {m === "preset" ? "Choose from list" : "Add custom card"}
            </button>
          ))}
        </div>

        {mode === "preset" ? (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {PRESET_CARDS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(selected?.id === p.id ? null : p)}
                className={`rounded-xl p-2 border-2 transition-all text-left ${
                  selected?.id === p.id
                    ? "border-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <CardVisual card={p} small />
                <p className="text-[11px] font-semibold text-foreground mt-1.5 leading-tight">
                  {p.issuer} {p.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  ${p.annualFee}/yr · {p.baseReward}{p.rewardType === "cashback" ? "%" : "x"}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            <input className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border placeholder:text-muted-foreground" placeholder="Card name (e.g. My Visa)" value={customName} onChange={(e) => setCustomName(e.target.value)} />
            <input className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border placeholder:text-muted-foreground" placeholder="Issuer (e.g. Chase)" value={customIssuer} onChange={(e) => setCustomIssuer(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Annual Fee ($)</label>
                <input type="number" className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border" value={customFee} onChange={(e) => setCustomFee(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Base Reward (%/x)</label>
                <input type="number" className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border" value={customBase} onChange={(e) => setCustomBase(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Optional fields */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Credit Limit ($)</label>
            <input type="number" className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border" placeholder="Optional" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Current Balance ($)</label>
            <input type="number" className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border" placeholder="Optional" value={balance} onChange={(e) => setBalance(e.target.value)} />
          </div>
        </div>
        {(mode === "preset" && selected?.signupBonus) && (
          <div className="mb-4">
            <label className="text-xs text-muted-foreground mb-1 block">Already spent toward signup bonus ($)</label>
            <input type="number" className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border" placeholder="0" value={spentBonus} onChange={(e) => setSpentBonus(e.target.value)} />
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm font-medium">Cancel</button>
          <button
            onClick={handleAdd}
            disabled={mode === "preset" ? !selected : !customName || !customIssuer}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40"
          >
            Add Card
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  expenses: Expense[];
  userProfile: UserProfile;
}

export function CreditCardHub({ expenses, userProfile }: Props) {
  const [cards, setCards] = useState<UserCard[]>(loadCards);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"cards" | "optimizer" | "next">("cards");

  const persistAdd = (card: UserCard) => {
    const next = [...cards, card];
    setCards(next);
    saveCards(next);
    setShowAdd(false);
  };

  const removeCard = (id: string) => {
    const next = cards.filter((c) => c.id !== id);
    setCards(next);
    saveCards(next);
  };

  // ── Category → best card mapping ──
  const allCategories = [...new Set(expenses.map((e) => mapCategory(e.category)))];
  const categoryTotals: Record<string, number> = {};
  for (const e of expenses) {
    const cat = mapCategory(e.category);
    categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
  }

  // ── Total rewards earned (estimated) ──
  const totalRewards = expenses.reduce((sum, e) => {
    const best = getBestCard(cards, e.category);
    return best ? sum + getEffectiveCashback(best, e.category, e.amount) : sum;
  }, 0);

  const totalFees = cards.reduce((s, c) => s + c.annualFee / 12, 0);
  const netRewards = totalRewards - totalFees;

  // ── Next card recommendation ──
  const recommendation = recommendNextCard(cards, expenses);

  // ── Utilization alerts ──
  const utilizationAlerts = cards
    .filter((c) => c.creditLimit && c.currentBalance)
    .map((c) => {
      const pct = ((c.currentBalance! / c.creditLimit!) * 100);
      return { card: c, pct };
    })
    .filter((a) => a.pct > 30);

  return (
    <div className="space-y-4 animate-in-up">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Credit Card <span className="text-gradient-gold">Hub</span></h2>
          <p className="text-xs text-muted-foreground">Maximize every swipe</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-xl"
        >
          <Plus size={13} /> Add Card
        </button>
      </div>

      {/* Summary row */}
      {cards.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-card rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">Est. Rewards</p>
            <p className="text-base font-bold text-primary">${totalRewards.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">this period</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">Annual Fees</p>
            <p className="text-base font-bold text-accent">${(totalFees * 12).toFixed(0)}/yr</p>
            <p className="text-[10px] text-muted-foreground">${totalFees.toFixed(2)}/mo</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">Net Value</p>
            <p className={`text-base font-bold ${netRewards >= 0 ? "text-primary" : "text-destructive"}`}>
              ${netRewards.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">rewards − fees</p>
          </div>
        </div>
      )}

      {/* Section tabs */}
      <div className="flex bg-secondary rounded-xl p-1 gap-1">
        {([
          { id: "cards", label: "My Cards", icon: CreditCard },
          { id: "optimizer", label: "Optimizer", icon: Zap },
          { id: "next", label: "Next Card", icon: Sparkles },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeSection === id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* ── MY CARDS ── */}
      {activeSection === "cards" && (
        <div className="space-y-3">
          {cards.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <CreditCard size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No cards added yet.</p>
              <button onClick={() => setShowAdd(true)} className="mt-3 text-primary text-sm font-medium underline underline-offset-2">
                Add your first card →
              </button>
            </div>
          ) : (
            cards.map((card) => {
              const util = card.creditLimit && card.currentBalance
                ? (card.currentBalance / card.creditLimit) * 100
                : null;
              const bonusPct = card.signupBonus && card.signupSpend
                ? Math.min(100, ((card.spentTowardBonus || 0) / card.signupSpend) * 100)
                : null;
              const isExpanded = expandedCard === card.id;

              return (
                <div key={card.id} className="glass-card rounded-xl overflow-hidden">
                  <div className="p-3">
                    <div className="flex gap-3 items-start">
                      <div className="w-28 shrink-0">
                        <CardVisual card={card} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <p className="text-sm font-bold text-foreground leading-tight">{card.issuer} {card.name}</p>
                            <p className="text-xs text-muted-foreground">{card.network} · ${card.annualFee}/yr</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setExpandedCard(isExpanded ? null : card.id)} className="p-1 text-muted-foreground">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <button onClick={() => removeCard(card.id)} className="p-1 text-muted-foreground hover:text-destructive">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Base reward chip */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
                            {card.baseReward}{card.rewardType === "cashback" ? "%" : "x"} base
                          </span>
                          {Object.entries(card.rewards).slice(0, 2).map(([cat, rate]) => (
                            <span key={cat} className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">
                              {rate}x {cat}
                            </span>
                          ))}
                        </div>

                        {/* Utilization */}
                        {util !== null && (
                          <div className="mt-2">
                            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                              <span>Utilization</span>
                              <span className={util > 30 ? "text-destructive" : "text-primary"}>{util.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${util > 30 ? "bg-destructive" : "bg-primary"}`}
                                style={{ width: `${Math.min(100, util)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Signup bonus progress */}
                        {bonusPct !== null && (
                          <div className="mt-2">
                            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                              <span className="flex items-center gap-0.5"><Gift size={9} /> Signup bonus</span>
                              <span className="text-accent">{bonusPct.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-accent" style={{ width: `${bonusPct}%` }} />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{card.signupBonus}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded rewards detail */}
                  {isExpanded && (
                    <div className="border-t border-border px-3 py-3 space-y-2">
                      <p className="text-xs font-semibold text-foreground">All Reward Categories</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {Object.entries(card.rewards).map(([cat, rate]) => (
                          <div key={cat} className="bg-secondary rounded-lg px-2 py-1.5 flex justify-between items-center">
                            <span className="text-xs text-foreground">{cat}</span>
                            <span className="text-xs font-bold text-accent">{rate}{card.rewardType === "cashback" ? "%" : "x"}</span>
                          </div>
                        ))}
                        <div className="bg-secondary rounded-lg px-2 py-1.5 flex justify-between items-center">
                          <span className="text-xs text-foreground">Everything else</span>
                          <span className="text-xs font-bold text-primary">{card.baseReward}{card.rewardType === "cashback" ? "%" : "x"}</span>
                        </div>
                      </div>
                      {card.signupBonus && (
                        <div className="bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 mt-1">
                          <p className="text-xs font-semibold text-accent flex items-center gap-1"><Star size={10} /> Signup Bonus</p>
                          <p className="text-xs text-muted-foreground">{card.signupBonus}</p>
                          {card.signupSpend && <p className="text-[10px] text-muted-foreground">Spend ${card.signupSpend.toLocaleString()} to unlock</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Interest / utilization alerts */}
          {utilizationAlerts.length > 0 && (
            <div className="glass-card rounded-xl p-4 border border-destructive/30 space-y-2">
              <p className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                <AlertTriangle size={14} /> High Utilization Alert
              </p>
              {utilizationAlerts.map(({ card, pct }) => (
                <div key={card.id} className="text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">{card.issuer} {card.name}</span> is at{" "}
                  <span className="text-destructive font-bold">{pct.toFixed(0)}%</span> utilization.{" "}
                  {pct > 30 && pct <= 50 ? "Try to pay down to below 30% to protect your credit score." : "High utilization significantly hurts your credit score. Pay down ASAP."}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── OPTIMIZER ── */}
      {activeSection === "optimizer" && (
        <div className="space-y-3">
          {cards.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <Zap size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Add your cards first to see per-category recommendations.</p>
            </div>
          ) : allCategories.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="text-sm text-muted-foreground">No expenses logged yet. Add some expenses to see optimized card suggestions.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Based on your expense history — use these cards to maximize rewards:</p>
              {allCategories
                .sort((a, b) => (categoryTotals[b] || 0) - (categoryTotals[a] || 0))
                .map((cat) => {
                  const best = getBestCard(cards, cat);
                  if (!best) return null;
                  const rate = getCardRate(best, cat);
                  const effectiveRate = rate * best.centsPerPoint;
                  const spend = categoryTotals[cat] || 0;
                  const earned = getEffectiveCashback(best, cat, spend);

                  return (
                    <div key={cat} className="glass-card rounded-xl p-4 flex items-center gap-3">
                      <div className="w-20 shrink-0">
                        <CardVisual card={best} small />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <p className="text-sm font-semibold text-foreground">{cat}</p>
                          <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-bold shrink-0">
                            {effectiveRate.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-tight">
                          Use <span className="text-foreground font-medium">{best.issuer} {best.name}</span> for {rate}{best.rewardType === "cashback" ? "%" : "x"} {best.rewardType}
                        </p>
                        <p className="text-xs text-primary font-medium mt-1">
                          +${earned.toFixed(2)} earned on ${spend.toFixed(0)} spent
                        </p>
                      </div>
                    </div>
                  );
                })}

              {/* Interest avoidance tips */}
              <div className="glass-card rounded-xl p-4 space-y-2 border border-primary/20">
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-primary" /> Interest Avoidance Tips
                </p>
                <ul className="space-y-1.5">
                  {[
                    "Pay your full statement balance every month to avoid interest charges (usually 20–29% APR).",
                    "Set up autopay for at least the minimum to never miss a payment.",
                    "If carrying a balance, prioritize the highest APR card first (avalanche method).",
                    cards.some((c) => c.annualFee > 0)
                      ? `Your paid cards cost $${cards.filter((c) => c.annualFee > 0).reduce((s, c) => s + c.annualFee, 0)}/yr — make sure rewards exceed fees.`
                      : "All your cards are no-fee. Great for building credit with zero cost!",
                  ].map((tip, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <span className="text-primary font-bold shrink-0 mt-0.5">·</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── NEXT CARD ── */}
      {activeSection === "next" && (
        <div className="space-y-3">
          {recommendation ? (
            <>
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-4">
                  <p className="text-xs font-semibold text-accent flex items-center gap-1 mb-3">
                    <Sparkles size={11} /> Recommended Next Card
                  </p>
                  <div className="flex gap-3 items-start">
                    <div className="w-28 shrink-0">
                      <CardVisual card={{ ...recommendation.card, id: recommendation.card.id }} small={false} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{recommendation.card.issuer} {recommendation.card.name}</p>
                      <p className="text-xs text-muted-foreground">{recommendation.card.network} · ${recommendation.card.annualFee}/yr</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(recommendation.card.rewards).slice(0, 3).map(([cat, rate]) => (
                          <span key={cat} className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full">
                            {rate}x {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-foreground font-medium flex items-center gap-1.5">
                      <TrendingUp size={11} className="text-primary" /> Why this card?
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{recommendation.reason}</p>
                  </div>
                  {recommendation.card.signupBonus && (
                    <div className="mt-2 bg-accent/10 border border-accent/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-accent font-medium flex items-center gap-1.5">
                        <Gift size={11} /> Signup Bonus
                      </p>
                      <p className="text-xs text-muted-foreground">{recommendation.card.signupBonus}</p>
                      {recommendation.card.signupSpend && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">Spend ${recommendation.card.signupSpend.toLocaleString()} in first few months</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Other available cards */}
              <p className="text-xs text-muted-foreground font-medium">Other cards you don't have yet</p>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_CARDS.filter((p) => !cards.some((c) => c.presetId === p.id) && p.id !== recommendation.card.id)
                  .slice(0, 4)
                  .map((p) => (
                    <div key={p.id} className="glass-card rounded-xl p-3">
                      <CardVisual card={p} small />
                      <p className="text-xs font-semibold text-foreground mt-1.5 leading-tight">{p.issuer} {p.name}</p>
                      <p className="text-[10px] text-muted-foreground">${p.annualFee}/yr · {p.baseReward}{p.rewardType === "cashback" ? "%" : "x"} base</p>
                      {p.signupBonus && <p className="text-[10px] text-accent mt-0.5">🎁 {p.signupBonus}</p>}
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div className="glass-card rounded-xl p-8 text-center">
              <Sparkles size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {cards.length === 0
                  ? "Add your existing cards first so we can recommend your next one."
                  : "You already have all the top cards in our catalogue! 🎉"}
              </p>
            </div>
          )}
        </div>
      )}

      {showAdd && <AddCardSheet onAdd={persistAdd} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
