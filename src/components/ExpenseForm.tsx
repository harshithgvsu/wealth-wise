import { useMemo, useState } from "react";
import { PlusCircle, Calendar, Tag, DollarSign, FileText, CreditCard, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardOption, CATEGORIES, Category, DEFAULT_CARD_OPTION, calculateRewards } from "@/hooks/useExpenses";

interface ExpenseFormProps {
  cardOptions: CardOption[];
  userId?: string;
  onAdd: (expense: {
    amount: number; category: Category; description: string; date: string;
    cardId?: string; cardLabel?: string; rewardRate?: number; rewardsEarned?: number;
  }) => void;
}

const fieldCx = "bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20";

export function ExpenseForm({ onAdd, cardOptions, userId }: ExpenseFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [cardId, setCardId] = useState<string>(DEFAULT_CARD_OPTION.id);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const rewardPreview = useMemo(() => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || !category) return null;
    return calculateRewards(parsed, cardId, category as Category, userId);
  }, [amount, category, cardId, userId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !description || !date || !cardId) {
      setShake(true); setTimeout(() => setShake(false), 400); return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    const selectedCard = cardOptions.find((c) => c.id === cardId);
    const rewardMeta = calculateRewards(parsed, cardId, category as Category, userId);
    onAdd({ amount: parsed, category: category as Category, description, date, cardId, cardLabel: selectedCard?.label, rewardRate: rewardMeta.rate, rewardsEarned: rewardMeta.rewardsEarned });
    setAmount(""); setDescription(""); setDate(today); setCardId(DEFAULT_CARD_OPTION.id);
    setSuccess(true); setTimeout(() => setSuccess(false), 1800);
  };

  return (
    <div className="glass-cyan rounded-xl p-5">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 rounded-lg bg-primary/15">
          <PlusCircle size={16} className="text-primary" />
        </div>
        <h2 className="text-base font-bold" style={{fontFamily:"'Syne',sans-serif"}}>Add Expense</h2>
      </div>

      <form onSubmit={handleSubmit} className={`space-y-4 ${shake ? "[animation:wiggle_0.3s_ease]" : ""}`}>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><DollarSign size={11} /> Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">$</span>
            <Input type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
              className={`pl-7 font-mono ${fieldCx}`} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Tag size={11} /> Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger className={fieldCx}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-[60]">
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-foreground focus:bg-secondary">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><CreditCard size={11} /> Card Used</Label>
          <Select value={cardId} onValueChange={setCardId}>
            <SelectTrigger className={fieldCx}>
              <SelectValue placeholder="Select card" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-[60]">
              {cardOptions.map((card) => (
                <SelectItem key={card.id} value={card.id} className="text-foreground focus:bg-secondary">{card.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {cardOptions.length <= 1 && (
            <p className="text-[11px] text-muted-foreground">Add cards in the Cards tab to see them here.</p>
          )}
          {rewardPreview && rewardPreview.rate > 0 && (
            <p className="text-[11px] text-primary flex items-center gap-1.5">
              <Gift size={10} /> {rewardPreview.rewardsEarned.toFixed(2)} {rewardPreview.rewardType} ({rewardPreview.rate}x)
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><FileText size={11} /> Description</Label>
          <Input placeholder="What did you spend on?" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={80} className={fieldCx} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar size={11} /> Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today} className={`${fieldCx} [color-scheme:dark]`} />
        </div>

        <button type="submit"
          className={`w-full font-semibold py-2.5 rounded-xl transition-all duration-300 text-sm ${
            success ? "bg-primary/15 text-primary border border-primary/30" : "text-black"
          }`}
          style={success ? {} : {background:"linear-gradient(135deg,hsl(185,100%,40%),hsl(195,100%,55%))"}}>
          {success ? "✓ Added!" : "Add Expense"}
        </button>
      </form>
    </div>
  );
}
