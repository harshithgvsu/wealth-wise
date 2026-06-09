import { useMemo, useState } from "react";
import { PlusCircle, Calendar, Tag, DollarSign, FileText, CreditCard, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardOption, CATEGORIES, Category, DEFAULT_CARD_OPTION, calculateRewards, localDateString } from "@/hooks/useExpenses";

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
  const today = localDateString();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [cardId, setCardId] = useState<string>(DEFAULT_CARD_OPTION.id);
  const [isRefund, setIsRefund] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const rewardPreview = useMemo(() => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || !category) return null;
    const preview = calculateRewards(parsed, cardId, category as Category, userId);
    if (isRefund) preview.rewardsEarned = -preview.rewardsEarned;
    return preview;
  }, [amount, category, cardId, userId, isRefund]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !description || !date || !cardId) {
      setShake(true); setTimeout(() => setShake(false), 400); return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed === 0) return;
    // iOS Safari ignores max= on date inputs — validate in JS too
    if (date > today) {
      setShake(true); setTimeout(() => setShake(false), 400); return;
    }
    const finalAmount = isRefund ? -Math.abs(parsed) : Math.abs(parsed);
    const selectedCard = cardOptions.find((c) => c.id === cardId);
    const rewardMeta = calculateRewards(Math.abs(parsed), cardId, category as Category, userId);
    const rewardsEarned = isRefund ? -rewardMeta.rewardsEarned : rewardMeta.rewardsEarned;

    onAdd({
      amount: finalAmount,
      category: category as Category,
      description,
      date,
      cardId,
      cardLabel: selectedCard?.label,
      rewardRate: rewardMeta.rate,
      rewardsEarned,
    });

    setAmount("");
    setDescription("");
    setDate(today);
    setCardId(DEFAULT_CARD_OPTION.id);
    setIsRefund(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1800);
  };

  return (
    <div className="glass-cyan rounded-xl p-5">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 rounded-lg bg-primary/15">
          <PlusCircle size={16} className="text-primary" />
        </div>
        <h2 className="text-base font-bold" style={{ fontFamily: "'Syne',sans-serif" }}>
          Add Expense
        </h2>
      </div>

      <form onSubmit={handleSubmit} className={`space-y-4 ${shake ? "[animation:wiggle_0.3s_ease]" : ""}`}>

        {/* Entry type toggle */}
        <div className="flex items-center justify-between py-1">
          <Label className="text-xs text-muted-foreground">Entry type</Label>
          <div className="flex bg-secondary rounded-lg p-0.5 gap-0.5">
            {(["Expense", "Refund"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setIsRefund(type === "Refund")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  (type === "Refund") === isRefund
                    ? type === "Refund"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-primary/20 text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <DollarSign size={11} /> {isRefund ? "Refund Amount" : "Amount"}
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
              {isRefund ? "-$" : "$"}
            </span>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`pl-8 font-mono ${fieldCx}`}
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Tag size={11} /> Category
          </Label>
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger className={fieldCx}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-[60]">
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-foreground focus:bg-secondary">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Card */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CreditCard size={11} /> Card Used
          </Label>
          <Select value={cardId} onValueChange={setCardId}>
            <SelectTrigger className={fieldCx}>
              <SelectValue placeholder="Select card" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-[60]">
              {cardOptions.map((card) => (
                <SelectItem key={card.id} value={card.id} className="text-foreground focus:bg-secondary">
                  {card.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {cardOptions.length <= 1 && (
            <p className="text-[11px] text-muted-foreground">Add cards in the Cards tab to see them here.</p>
          )}
          {rewardPreview && rewardPreview.rate > 0 && (
            <p className={`text-[11px] flex items-center gap-1.5 ${isRefund ? "text-amber-400" : "text-primary"}`}>
              <Gift size={10} />
              {isRefund ? "-" : ""}{Math.abs(rewardPreview.rewardsEarned).toFixed(2)} {rewardPreview.rewardType} ({rewardPreview.rate}x)
              {isRefund && " deducted"}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FileText size={11} /> Description
          </Label>
          <Input
            placeholder={isRefund ? "What was refunded?" : "What did you spend on?"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={80}
            className={fieldCx}
          />
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar size={11} /> Date
          </Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            className={`${fieldCx} [color-scheme:dark]`}
          />
        </div>

        <button
          type="submit"
          className={`w-full font-semibold py-2.5 rounded-xl transition-all duration-300 text-sm ${
            success
              ? isRefund
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                : "bg-primary/15 text-primary border border-primary/30"
              : "text-black"
          }`}
          style={success ? {} : {
            background: isRefund
              ? "linear-gradient(135deg,hsl(38,95%,50%),hsl(45,100%,60%))"
              : "linear-gradient(135deg,hsl(185,100%,40%),hsl(195,100%,55%))",
          }}
        >
          {success ? "✓ Added!" : isRefund ? "Add Refund" : "Add Expense"}
        </button>
      </form>
    </div>
  );
}