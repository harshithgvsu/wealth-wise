import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Mic,
  MicOff,
  Bot,
  User,
  Loader2,
  Plus,
} from "lucide-react";
import { Expense, CATEGORIES, Category } from "@/hooks/useExpenses";
import { UserProfile } from "@/hooks/useAuth";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface AIChatProps {
  expenses: Expense[];
  userProfile: UserProfile;
  onAddExpense?: (expense: Omit<Expense, "id" | "createdAt">) => void;
}

// ---- AI logic (rule-based, no API key needed) ----
function generateAIResponse(
  userMessage: string,
  expenses: Expense[],
  profile: UserProfile
): string {
  const msg = userMessage.toLowerCase();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
  });

  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const byCategory: Partial<Record<Category, number>> = {};
  for (const e of monthExpenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }
  const sorted = Object.entries(byCategory).sort(([, a], [, b]) => b - a);

  const fixedExpenses =
    profile.rentMortgage +
    profile.carPayment +
    profile.insurancePremiums +
    profile.subscriptions +
    profile.otherFixedExpenses;
  const disposable = profile.netMonthlyIncome - fixedExpenses;
  const savingsTarget = (profile.savingsGoalPercent / 100) * profile.netMonthlyIncome;
  const remainingBudget = disposable - totalSpent;

  // Spending queries
  if (msg.includes("spend") || msg.includes("spent") || msg.includes("how much")) {
    if (msg.includes("food") || msg.includes("dining") || msg.includes("eat")) {
      const amt = byCategory["Food & Dining"] || 0;
      return `You've spent **$${amt.toFixed(2)}** on Food & Dining this month. That's ${((amt / totalSpent) * 100).toFixed(0)}% of your total spending. ${amt > 300 ? "💡 Cooking at home a few more times per week could save you $100–$200/month." : "Great job keeping food costs in check!"}`;
    }
    if (msg.includes("transport") || msg.includes("uber") || msg.includes("car")) {
      const amt = byCategory["Transport"] || 0;
      return `Your Transport spending this month: **$${amt.toFixed(2)}**. ${amt > 150 ? "Consider using public transit or carpooling to reduce this." : "Transport costs look reasonable!"}`;
    }
    if (msg.includes("total") || msg.includes("this month") || msg.includes("month")) {
      return `This month you've spent **$${totalSpent.toFixed(2)}** across ${monthExpenses.length} transactions. ${remainingBudget > 0 ? `You have **$${remainingBudget.toFixed(2)}** of your disposable budget remaining. Keep it up! 💪` : `You've exceeded your disposable budget by **$${Math.abs(remainingBudget).toFixed(2)}**. Consider cutting back on discretionary spending.`}`;
    }
    const top = sorted[0];
    return `This month you've spent **$${totalSpent.toFixed(2)}** total. Your biggest category is **${top?.[0] || "—"}** at $${(top?.[1] || 0).toFixed(2)}. You have $${remainingBudget.toFixed(2)} left in your disposable budget.`;
  }

  // Savings advice
  if (msg.includes("save") || msg.includes("saving") || msg.includes("cut") || msg.includes("reduce")) {
    const suggestions: string[] = [];
    const food = byCategory["Food & Dining"] || 0;
    const ent = byCategory["Entertainment"] || 0;
    const shop = byCategory["Shopping"] || 0;

    if (food > 400) suggestions.push(`🍽 Reduce dining out — you spent $${food.toFixed(0)} on food. Meal prepping 3 days/week could save ~$120/month.`);
    if (ent > 100) suggestions.push(`🎬 Entertainment ($${ent.toFixed(0)}) — review streaming subscriptions you rarely use.`);
    if (shop > 200) suggestions.push(`🛍 Shopping ($${shop.toFixed(0)}) — try a 48-hour rule before non-essential purchases.`);
    if (profile.subscriptions > 0) suggestions.push(`📱 You have $${profile.subscriptions}/mo in subscriptions. Audit them quarterly.`);

    const potentialSavings = (food > 400 ? 120 : 0) + (ent > 100 ? 30 : 0) + (shop > 200 ? 60 : 0);

    if (suggestions.length === 0) {
      return `Your spending looks well-managed! You're on track to save ${profile.savingsGoalPercent}% of your income this month. Keep building that emergency fund!`;
    }

    return `Here are my top savings recommendations:\n\n${suggestions.join("\n\n")}\n\n💰 **Potential monthly savings: ~$${potentialSavings}** — that's $${(potentialSavings * 12).toFixed(0)}/year!`;
  }

  // Investment advice
  if (msg.includes("invest") || msg.includes("stock") || msg.includes("etf") || msg.includes("fund") || msg.includes("portfolio")) {
    const monthlyInvestable = Math.max(0, disposable - totalSpent - savingsTarget * 0.5);
    const riskMap = {
      conservative: "70% bonds (BND), 20% US stocks (VTI), 10% international (VXUS)",
      moderate: "60% US stocks (VTI), 20% international (VXUS), 15% bonds (BND), 5% REITs (VNQ)",
      aggressive: "70% US stocks (VTI), 20% international (VXUS), 5% small-cap (VB), 5% emerging markets (VWO)",
    };
    const allocation = riskMap[profile.riskTolerance];

    return `Based on your **${profile.riskTolerance}** risk profile and **${profile.investmentHorizonYears}-year** horizon:\n\n**Suggested allocation:**\n${allocation}\n\n**Monthly investable amount:** ~$${monthlyInvestable.toFixed(0)}\n\nAt 7% avg annual return, investing $${monthlyInvestable.toFixed(0)}/month for ${profile.investmentHorizonYears} years → **~$${(monthlyInvestable * 12 * ((Math.pow(1.07, profile.investmentHorizonYears) - 1) / 0.07 / 12)).toFixed(0)}**\n\n💡 Start with a low-cost index fund like VTI at Fidelity or Vanguard.`;
  }

  // Prediction
  if (msg.includes("predict") || msg.includes("forecast") || msg.includes("next month") || msg.includes("trend")) {
    const last3Months: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const m = currentMonth - i <= 0 ? currentMonth - i + 12 : currentMonth - i;
      const y = currentMonth - i <= 0 ? currentYear - 1 : currentYear;
      const total = expenses
        .filter((e) => {
          const d = new Date(e.date);
          return d.getFullYear() === y && d.getMonth() + 1 === m;
        })
        .reduce((s, e) => s + e.amount, 0);
      if (total > 0) last3Months.push(total);
    }

    const avg = last3Months.length > 0 ? last3Months.reduce((s, v) => s + v, 0) / last3Months.length : totalSpent;
    const trend = last3Months.length > 1 ? (last3Months[0] - last3Months[last3Months.length - 1]) / last3Months[last3Months.length - 1] : 0;
    const projected = avg * (1 + trend * 0.5);

    return `Based on your spending history, I forecast next month's expenses at approximately **$${projected.toFixed(2)}**.\n\n${trend > 0.05 ? `⚠️ Your spending has been trending **up ${(trend * 100).toFixed(0)}%** — consider setting a budget cap.` : trend < -0.05 ? `✅ Your spending is trending **down ${(Math.abs(trend) * 100).toFixed(0)}%** — great progress!` : "📊 Your spending is relatively stable month-over-month."}\n\n**Disposable budget:** $${disposable.toFixed(2)}\n**Savings target:** $${savingsTarget.toFixed(2)}\n**Remaining after forecast:** $${(disposable - projected).toFixed(2)}`;
  }

  // Budget / income queries
  if (msg.includes("budget") || msg.includes("income") || msg.includes("salary")) {
    return `**Your monthly financial snapshot:**\n\n💵 Gross income: $${profile.grossMonthlyIncome.toFixed(2)}\n🏠 Take-home: $${profile.netMonthlyIncome.toFixed(2)}\n🔒 Fixed expenses: $${fixedExpenses.toFixed(2)}\n💡 Disposable: $${disposable.toFixed(2)}\n🎯 Savings goal: $${savingsTarget.toFixed(2)} (${profile.savingsGoalPercent}%)\n📊 Spent this month: $${totalSpent.toFixed(2)}\n✅ Remaining: $${remainingBudget.toFixed(2)}`;
  }

  // Greeting
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.length < 10) {
    return `Hi! I'm your WealthWise AI assistant 👋\n\nI can help you:\n• 📊 **Analyze spending** — "How much did I spend on food?"\n• 💡 **Save money** — "Where can I cut back?"\n• 📈 **Invest** — "What should I invest in?"\n• 🔮 **Predict trends** — "Forecast next month"\n• 💰 **Budget overview** — "Show my budget"\n\nWhat would you like to know?`;
  }

  return `I can analyze your spending, suggest savings, recommend investments, and predict trends. Try asking:\n• "How much did I spend this month?"\n• "Where can I save money?"\n• "What should I invest in?"\n• "Predict next month's spending"`;
}

// ---- Parse voice command to add expense ----
function parseExpenseFromVoice(text: string): Omit<Expense, "id" | "createdAt"> | null {
  const lower = text.toLowerCase();
  const amountMatch = lower.match(/\$?([\d]+(?:\.\d{1,2})?)/);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1]);
  if (isNaN(amount) || amount <= 0) return null;

  let category: Category = "Other";
  if (lower.includes("food") || lower.includes("lunch") || lower.includes("dinner") || lower.includes("coffee") || lower.includes("restaurant") || lower.includes("grocery") || lower.includes("eat")) category = "Food & Dining";
  else if (lower.includes("uber") || lower.includes("taxi") || lower.includes("bus") || lower.includes("gas") || lower.includes("transport") || lower.includes("commute")) category = "Transport";
  else if (lower.includes("shop") || lower.includes("amazon") || lower.includes("cloth") || lower.includes("buy")) category = "Shopping";
  else if (lower.includes("doctor") || lower.includes("pharmacy") || lower.includes("health") || lower.includes("gym") || lower.includes("medicine")) category = "Health";
  else if (lower.includes("movie") || lower.includes("netflix") || lower.includes("entertainment") || lower.includes("concert") || lower.includes("game")) category = "Entertainment";
  else if (lower.includes("bill") || lower.includes("electric") || lower.includes("internet") || lower.includes("utility") || lower.includes("phone")) category = "Bills & Utilities";
  else if (lower.includes("course") || lower.includes("book") || lower.includes("school") || lower.includes("education") || lower.includes("tuition")) category = "Education";

  // Extract description (remove amount and category keywords)
  const description = text.replace(/\$?[\d]+(?:\.\d{1,2})?/, "").replace(/\b(spent|spend|paid|pay|for|on|added?|logged?)\b/gi, "").trim() || `${category} expense`;

  return {
    amount,
    category,
    description: description.charAt(0).toUpperCase() + description.slice(1),
    date: new Date().toISOString().split("T")[0],
  };
}

export function AIChat({ expenses, userProfile, onAddExpense }: AIChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi ${userProfile.name.split(" ")[0]}! 👋 I'm your AI financial assistant. Ask me about your spending, savings, investments, or say "add $12 lunch food" to log an expense by voice or text!`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsTyping(true);

    // Check if it's an expense log command
    const lowerText = text.toLowerCase();
    const isExpenseCommand = /\b(add|log|spent|spend|paid|pay)\b/.test(lowerText) && /\$?[\d]+/.test(lowerText);

    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

    let responseContent = "";

    if (isExpenseCommand && onAddExpense) {
      const parsed = parseExpenseFromVoice(text);
      if (parsed) {
        onAddExpense(parsed);
        responseContent = `✅ Added **$${parsed.amount.toFixed(2)}** to **${parsed.category}** — "${parsed.description}" for today. You can see it in your expense list!`;
      } else {
        responseContent = "I couldn't parse that expense. Try: \"Add $15 lunch food\" or \"Spent $50 on groceries\"";
      }
    } else {
      responseContent = generateAIResponse(text, expenses, userProfile);
    }

    setIsTyping(false);
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "assistant", content: responseContent, timestamp: Date.now() },
    ]);
  };

  const startVoice = () => {
    type SpeechRecognitionCtor = new () => { continuous: boolean; interimResults: boolean; lang: string; onstart: (() => void) | null; onend: (() => void) | null; onerror: (() => void) | null; onresult: ((e: SpeechRecognitionEvent) => void) | null; start: () => void; stop: () => void };
    const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setInput("Voice not supported in this browser. Try Chrome or Safari.");
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      sendMessage(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // Format markdown-lite (bold)
  const formatContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="text-foreground font-semibold">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center pulse-glow hover:opacity-90 transition-opacity"
        aria-label="Open AI Chat"
      >
        <MessageSquare size={22} className="text-primary-foreground" />
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 sm:bg-transparent" onClick={() => setOpen(false)} />

          <div className="relative w-full sm:w-96 h-[85vh] sm:h-[600px] glass-card rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">WealthWise AI</p>
                <p className="text-xs text-muted-foreground">Financial Assistant</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b border-border">
              {[
                "Total spent?",
                "Save money",
                "Invest advice",
                "Next month?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "assistant" ? "bg-primary/20" : "bg-secondary"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Bot size={13} className="text-primary" />
                    ) : (
                      <User size={13} className="text-muted-foreground" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-secondary text-secondary-foreground rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? formatContent(msg.content) : msg.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot size={13} className="text-primary" />
                  </div>
                  <div className="bg-secondary px-3 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-1">
                    <Loader2 size={13} className="text-muted-foreground animate-spin" />
                    <span className="text-xs text-muted-foreground">Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-border bg-card">
              {isListening && (
                <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  <span className="text-xs text-destructive font-medium">Listening… speak now</span>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                  placeholder='Ask anything or "Add $12 lunch"'
                  className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={isListening ? stopVoice : startVoice}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isListening
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  <Send size={15} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 px-1">
                💡 Say "Add $25 groceries" to log via voice
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
