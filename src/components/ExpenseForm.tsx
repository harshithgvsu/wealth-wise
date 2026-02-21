import { useState } from "react";
import { PlusCircle, Calendar, Tag, DollarSign, FileText } from "lucide-react";
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
import { CATEGORIES, Category } from "@/hooks/useExpenses";

interface ExpenseFormProps {
  onAdd: (expense: {
    amount: number;
    category: Category;
    description: string;
    date: string;
  }) => void;
}

export function ExpenseForm({ onAdd }: ExpenseFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !description || !date) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    onAdd({ amount: parsed, category: category as Category, description, date });
    setAmount("");
    setDescription("");
    setDate(today);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1800);
  };

  return (
    <div className="glass-card border border-navy-border rounded-xl p-5">
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
        {/* Amount */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <DollarSign size={11} /> Amount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
              $
            </span>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-7 bg-navy-surface border-navy-border font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-emerald/50 focus:ring-emerald/20"
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Tag size={11} /> Category
          </Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as Category)}
          >
            <SelectTrigger className="bg-navy-surface border-navy-border text-foreground focus:border-emerald/50 focus:ring-emerald/20">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-navy-card border-navy-border z-[60]" position="popper" sideOffset={4}>
              {CATEGORIES.map((cat) => (
                <SelectItem
                  key={cat}
                  value={cat}
                  className="text-foreground focus:bg-navy-surface focus:text-foreground"
                >
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FileText size={11} /> Description
          </Label>
          <Input
            placeholder="What did you spend on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={80}
            className="bg-navy-surface border-navy-border text-foreground placeholder:text-muted-foreground/50 focus:border-emerald/50 focus:ring-emerald/20"
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
            className="bg-navy-surface border-navy-border text-foreground focus:border-emerald/50 focus:ring-emerald/20 [color-scheme:dark]"
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
