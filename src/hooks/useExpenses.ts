import { useState, useEffect, useCallback, useRef } from "react";

export type Category =
  | "Food & Dining"
  | "Transport"
  | "Shopping"
  | "Health"
  | "Entertainment"
  | "Bills & Utilities"
  | "Education"
  | "Other";

export type RewardType = "points" | "miles" | "cashback";

export interface CardOption {
  id: string;
  label: string;
  rewardType: RewardType;
  baseRate: number;
  categoryRates?: Partial<Record<Category, number>>;
}

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO date string YYYY-MM-DD
  createdAt: number;
  cardId?: string;
  cardLabel?: string;
  rewardRate?: number;
  rewardsEarned?: number;
  rewardType?: RewardType;
}

export const CATEGORIES: Category[] = [
  "Food & Dining",
  "Transport",
  "Shopping",
  "Health",
  "Entertainment",
  "Bills & Utilities",
  "Education",
  "Other",
];

export const CARD_OPTIONS: CardOption[] = [
  {
    id: "no-rewards",
    label: "Cash / Debit (No rewards)",
    rewardType: "cashback",
    baseRate: 0,
  },
  {
    id: "chase-sapphire-preferred",
    label: "Chase Sapphire Preferred",
    rewardType: "points",
    baseRate: 1,
    categoryRates: {
      "Food & Dining": 3,
      Transport: 2,
      Entertainment: 2,
    },
  },
  {
    id: "amex-gold",
    label: "Amex Gold",
    rewardType: "points",
    baseRate: 1,
    categoryRates: {
      "Food & Dining": 4,
      Shopping: 2,
    },
  },
  {
    id: "citi-double-cash",
    label: "Citi Double Cash",
    rewardType: "cashback",
    baseRate: 2,
  },
  {
    id: "venture-x",
    label: "Capital One Venture X",
    rewardType: "miles",
    baseRate: 2,
    categoryRates: {
      Transport: 5,
      "Food & Dining": 2,
    },
  },
];

export const CATEGORY_COLORS: Record<Category, string> = {
  "Food & Dining": "hsl(152 76% 40%)",
  Transport: "hsl(210 80% 55%)",
  Shopping: "hsl(280 70% 55%)",
  Health: "hsl(0 72% 55%)",
  Entertainment: "hsl(45 90% 55%)",
  "Bills & Utilities": "hsl(200 80% 50%)",
  Education: "hsl(170 70% 45%)",
  Other: "hsl(215 20% 55%)",
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
const SESSION_TOKEN_KEY = "spendwise_session_token";
const STORAGE_KEY = (userId?: string) => `spendwise_expenses_${userId || "default"}`;
const CARDS_STORAGE_KEY = (userId?: string) => `spendwise_cards_${userId || "default"}`;

const CATEGORY_NORMALIZATION: Record<string, Category> = {
  "food": "Food & Dining",
  "dining": "Food & Dining",
  "restaurant": "Food & Dining",
  "restaurants": "Food & Dining",
  "groceries": "Food & Dining",
  "grocery": "Food & Dining",
  "transport": "Transport",
  "travel": "Transport",
  "transit": "Transport",
  "gas": "Transport",
  "shopping": "Shopping",
  "retail": "Shopping",
  "health": "Health",
  "medical": "Health",
  "entertainment": "Entertainment",
  "bills": "Bills & Utilities",
  "utilities": "Bills & Utilities",
  "education": "Education",
};

function normalizeCategoryKey(key: string): Category | null {
  const cleaned = key.toLowerCase().replace(/[^a-z& ]/g, "").trim();
  if (!cleaned) return null;
  if ((CATEGORIES as string[]).includes(key)) return key as Category;
  if ((CATEGORIES as string[]).includes(cleaned)) return cleaned as Category;
  return CATEGORY_NORMALIZATION[cleaned] || null;
}

export function getExpenseCardOptions(userId?: string): CardOption[] {
  try {
    const cards = JSON.parse(localStorage.getItem(CARDS_STORAGE_KEY(userId)) || "[]") as HubCard[];
    if (!Array.isArray(cards) || cards.length === 0) return [DEFAULT_CARD_OPTION];

    const mapped: CardOption[] = cards.map((card) => {
      const categoryRates: Partial<Record<Category, number>> = {};
      const rawRewards = card.rewards || {};
      for (const [key, value] of Object.entries(rawRewards)) {
        const normalized = normalizeCategoryKey(key);
        if (normalized) categoryRates[normalized] = value;
      }

      return {
        id: card.id,
        label: card.issuer ? `${card.name} (${card.issuer})` : card.name,
        rewardType: card.rewardType || "points",
        baseRate: card.baseReward ?? 1,
        categoryRates,
      };
    });

    return [DEFAULT_CARD_OPTION, ...mapped];
  } catch {
    return [DEFAULT_CARD_OPTION];
  }
}

export function getCardRewardRate(cardId: string | undefined, category: Category, userId?: string): number {
  const options = getExpenseCardOptions(userId);
  const card = options.find((c) => c.id === cardId) || DEFAULT_CARD_OPTION;
  return card.categoryRates?.[category] ?? card.baseRate;
}

export function calculateRewards(
  amount: number,
  cardId: string | undefined,
  category: Category,
  userId?: string
): {
  rate: number;
  rewardType: RewardType;
  rewardsEarned: number;
} {
  const options = getExpenseCardOptions(userId);
  const card = options.find((c) => c.id === cardId) || DEFAULT_CARD_OPTION;
  const rate = card.categoryRates?.[category] ?? card.baseRate;
  const rewardsEarned = amount * rate;
  return {
    rate,
    rewardType: card.rewardType,
    rewardsEarned: Number(rewardsEarned.toFixed(2)),
  };
}

export function getCardRewardRate(cardId: string | undefined, category: Category): number {
  const card = CARD_OPTIONS.find((c) => c.id === cardId);
  if (!card) return 0;
  return card.categoryRates?.[category] ?? card.baseRate;
}

export function calculateRewards(amount: number, cardId: string | undefined, category: Category): {
  rate: number;
  rewardType: RewardType;
  rewardsEarned: number;
} {
  const card = CARD_OPTIONS.find((c) => c.id === cardId) || CARD_OPTIONS[0];
  const rate = card.categoryRates?.[category] ?? card.baseRate;
  const rewardsEarned = (amount * rate) / 1;
  return {
    rate,
    rewardType: card.rewardType,
    rewardsEarned: Number(rewardsEarned.toFixed(2)),
  };
}

function readExpenses(key: string): Expense[] {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function useExpenses(userId?: string) {
  const storageKey = STORAGE_KEY(userId);
  const prevKeyRef = useRef(storageKey);
  const [expenses, setExpenses] = useState<Expense[]>(() => readExpenses(storageKey));

  useEffect(() => {
    if (prevKeyRef.current !== storageKey) {
      prevKeyRef.current = storageKey;
      setExpenses(readExpenses(storageKey));
    }
  }, [storageKey]);

  useEffect(() => {
    if (!API_BASE_URL || !userId) return;

    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    const params = new URLSearchParams({ userId });
    fetch(`${API_BASE_URL}/expenses?${params.toString()}`, {
      headers: {
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch expenses");
        return (await res.json()) as { expenses?: Expense[] };
      })
      .then((data) => {
        if (Array.isArray(data.expenses)) {
          setExpenses(data.expenses);
        }
      })
      .catch(() => undefined);
  }, [userId, storageKey]);

  // Persist whenever expenses change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(expenses));
  }, [expenses, storageKey]);

  const addExpense = useCallback((expense: Omit<Expense, "id" | "createdAt">) => {
    const cardId = expense.cardId || "no-rewards";
    const selectedCard = CARD_OPTIONS.find((card) => card.id === cardId) || CARD_OPTIONS[0];
    const rewardMeta = calculateRewards(expense.amount, cardId, expense.category);

    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      cardId,
      cardLabel: expense.cardLabel || selectedCard.label,
      rewardRate: rewardMeta.rate,
      rewardType: rewardMeta.rewardType,
      rewardsEarned: rewardMeta.rewardsEarned,
    };
    setExpenses((prev) => [newExpense, ...prev]);

    if (API_BASE_URL && userId) {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
      fetch(`${API_BASE_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({ userId, expense: newExpense }),
      }).catch(() => undefined);
    }

    return newExpense;
  }, [userId]);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));

    if (API_BASE_URL && userId) {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
      const params = new URLSearchParams({ userId });
      fetch(`${API_BASE_URL}/expenses/${id}?${params.toString()}`, {
        method: "DELETE",
        headers: {
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
      }).catch(() => undefined);
    }
  }, [userId]);

  const resetExpenses = useCallback(() => {
    setExpenses([]);
    localStorage.removeItem(storageKey);

    if (API_BASE_URL && userId) {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
      const params = new URLSearchParams({ userId });
      fetch(`${API_BASE_URL}/expenses?${params.toString()}`, {
        method: "DELETE",
        headers: {
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
      }).catch(() => undefined);
    }
  }, [storageKey, userId]);

  const getMonthExpenses = useCallback((year: number, month: number) => {
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  }, [expenses]);

  const getTotalByCategory = useCallback((exps: Expense[]) => {
    const map: Partial<Record<Category, number>> = {};
    for (const e of exps) {
      map[e.category] = (map[e.category] || 0) + e.amount;
    }
    return map;
  }, []);

  const getDailyTotals = useCallback((exps: Expense[]) => {
    const map: Record<string, number> = {};
    for (const e of exps) {
      map[e.date] = (map[e.date] || 0) + e.amount;
    }
    return map;
  }, []);

  return {
    expenses,
    addExpense,
    deleteExpense,
    resetExpenses,
    getMonthExpenses,
    getTotalByCategory,
    getDailyTotals,
  };
}
