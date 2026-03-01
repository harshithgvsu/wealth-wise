import { useMemo, useState } from "react";
import { PlusCircle, Calendar, Tag, DollarSign, FileText, CreditCard, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CARD_OPTIONS,
  CATEGORIES,
  Category,
  calculateRewards,
} from "@/hooks/useExpenses";

interface ExpenseFormProps {
  cardOptions: CardOption[];
  userId?: string;
  onAdd: (expense: {
    amount: number;
    category: Category;
    description: string;
    date: string;
    cardId?: string;
    cardLabel?: string;
    rewardRate?: number;
    rewardsEarned?: number;
  }) => void;
}

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
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    const selectedCard = cardOptions.find((card) => card.id === cardId);
    const rewardMeta = calculateRewards(parsed, cardId, category as Category, userId);

    onAdd({
      amount: parsed,
      category: category as Category,
      description,
      date,
      cardId,
      cardLabel: selectedCard?.label,
      rewardRate: rewardMeta.rate,
      rewardsEarned: rewardMeta.rewardsEarned,
    });
    setAmount("");
    setDescription("");
    setDate(today);
    setCardId(DEFAULT_CARD_OPTION.id);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1800);
  };

  return (
    <div className="glass-card border border-navy-border rounded-xl p-5 bg-navy-card/90 backdrop-blur-md shadow-xl">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 rounded-lg bg-emerald/15">
          <PlusCircle size={18} className="text-emerald" />
        </div>
        <h2 className="text-base font-semibold text-foreground">Add Expense</h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`space-y-4 transition-all ${shake ? "animate-[wiggle_0.3s_ease]" : ""}`}
      >
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <DollarSign size={11} /> Amount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">$
            </span>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-7 bg-navy-surface/90 border-navy-border font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-emerald/50 focus:ring-emerald/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Tag size={11} /> Category
          </Label>
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger className="bg-navy-surface/90 border-navy-border text-foreground focus:border-emerald/50 focus:ring-emerald/20">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-navy-card border-navy-border z-[60]">
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-foreground focus:bg-navy-surface focus:text-foreground">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {rewardPreview && (
            <p className="text-[11px] text-primary/90 flex items-center gap-1.5">
              <Gift size={11} />
              Estimated rewards: {rewardPreview.rewardsEarned.toFixed(2)} {rewardPreview.rewardType}
              {rewardPreview.rate > 0 ? ` (${rewardPreview.rate}x)` : ""}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CreditCard size={11} /> Card Used
          </Label>
          <Select value={cardId} onValueChange={setCardId}>
            <SelectTrigger className="bg-navy-surface/90 border-navy-border text-foreground focus:border-emerald/50 focus:ring-emerald/20">
              <SelectValue placeholder="Select card" />
            </SelectTrigger>
            <SelectContent className="bg-navy-card border-navy-border z-[60]">
              {cardOptions.map((card) => (
                <SelectItem key={card.id} value={card.id} className="text-foreground focus:bg-navy-surface focus:text-foreground">
                  {card.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {cardOptions.length <= 1 && (
            <p className="text-[11px] text-muted-foreground">Add cards in Credit Card Hub to see them here.</p>
          )}
          {rewardPreview && (
            <p className="text-[11px] text-primary/90 flex items-center gap-1.5">
              <Gift size={11} />
              Estimated rewards: {rewardPreview.rewardsEarned.toFixed(2)} {rewardPreview.rewardType}
              {rewardPreview.rate > 0 ? ` (${rewardPreview.rate}x)` : ""}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FileText size={11} /> Description
          </Label>
          <Input
            placeholder="What did you spend on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={80}
            className="bg-navy-surface/90 border-navy-border text-foreground placeholder:text-muted-foreground/60 focus:border-emerald/50 focus:ring-emerald/20"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar size={11} /> Date
          </Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            className="bg-navy-surface/90 border-navy-border text-foreground focus:border-emerald/50 focus:ring-emerald/20 [color-scheme:dark]"
          />
        </div>

        <Button
          type="submit"
          className={`w-full font-semibold transition-all duration-300 ${
            success
              ? "bg-emerald/20 text-emerald border border-emerald/30"
              : "bg-gradient-primary text-primary-foreground hover:opacity-90 glow-primary"
          }`}
        >
          {success ? "✓ Added!" : "Add Expense"}
        </Button>
      </form>
    </div>
  );
}
