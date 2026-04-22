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

interface HubCard {
  id: string;
  name: string;
  issuer?: string;
  rewardType?: RewardType;
  baseReward?: number;
  rewards?: Record<string, unknown>;
}

// Returns today's date as "YYYY-MM-DD" in LOCAL time (not UTC).
// new Date().toISOString() returns UTC — in US timezones after ~7pm this
// gives tomorrow's date. This function always gives the correct local date.
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Parse a stored "YYYY-MM-DD" date string into {year, month, day} without
// timezone conversion. new Date("2026-04-01") treats it as UTC midnight
// which becomes March 31 in US timezones — this avoids that entirely.
export function parseDateString(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { year: y, month: m, day: d };
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

export const DEFAULT_CARD_OPTION: CardOption = {
  id: "no-rewards",
  label: "Cash / Debit (No rewards)",
  rewardType: "cashback",
  baseRate: 0,
};

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
  food: "Food & Dining",
  dining: "Food & Dining",
  restaurant: "Food & Dining",
  restaurants: "Food & Dining",
  groceries: "Food & Dining",
  grocery: "Food & Dining",
  transport: "Transport",
  travel: "Transport",
  transit: "Transport",
  gas: "Transport",
  shopping: "Shopping",
  retail: "Shopping",
  health: "Health",
  medical: "Health",
  entertainment: "Entertainment",
  bills: "Bills & Utilities",
  utilities: "Bills & Utilities",
  education: "Education",
};

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function normalizeCategoryKey(key: string): Category | null {
  const trimmed = key.trim();
  if (!trimmed) return null;

  const directMatch = CATEGORIES.find((category) => category.toLowerCase() === trimmed.toLowerCase());
  if (directMatch) return directMatch;

  const cleaned = trimmed.toLowerCase().replace(/[^a-z& ]/g, "").trim();
  if (!cleaned) return null;
  return CATEGORY_NORMALIZATION[cleaned] || null;
}

export function getExpenseCardOptions(userId?: string): CardOption[] {
  const storage = getStorage();
  if (!storage) return [DEFAULT_CARD_OPTION];

  try {
    const cards = JSON.parse(storage.getItem(CARDS_STORAGE_KEY(userId)) || "[]") as HubCard[];
    if (!Array.isArray(cards) || cards.length === 0) return [DEFAULT_CARD_OPTION];

    const mapped: CardOption[] = cards
      .filter((card) => typeof card?.id === "string" && typeof card?.name === "string")
      .map((card) => {
        const categoryRates: Partial<Record<Category, number>> = {};
        const rawRewards = card.rewards || {};

        for (const [key, rawValue] of Object.entries(rawRewards)) {
          const normalized = normalizeCategoryKey(key);
          const value = typeof rawValue === "number" ? rawValue : Number(rawValue);
          if (normalized && Number.isFinite(value)) categoryRates[normalized] = value;
        }

        return {
          id: card.id,
          label: card.issuer ? `${card.name} (${card.issuer})` : card.name,
          rewardType: card.rewardType || "points",
          baseRate: Number.isFinite(card.baseReward) ? Number(card.baseReward) : 1,
          categoryRates,
        };
      });

    return mapped.length ? [DEFAULT_CARD_OPTION, ...mapped] : [DEFAULT_CARD_OPTION];
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

function readExpenses(key: string): Expense[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const stored = storage.getItem(key);
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

    const storage = getStorage();
    const sessionToken = storage?.getItem(SESSION_TOKEN_KEY);
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
        if (Array.isArray(data.expenses)) setExpenses(data.expenses);
      })
      .catch(() => undefined);
  }, [userId, storageKey]);

  useEffect(() => {
    const storage = getStorage();
    storage?.setItem(storageKey, JSON.stringify(expenses));
  }, [expenses, storageKey]);

  const addExpense = useCallback((expense: Omit<Expense, "id" | "createdAt">) => {
    const cardOptions = getExpenseCardOptions(userId);
    const cardId = expense.cardId || DEFAULT_CARD_OPTION.id;
    const selectedCard = cardOptions.find((card) => card.id === cardId) || DEFAULT_CARD_OPTION;
    const rewardMeta = calculateRewards(expense.amount, cardId, expense.category, userId);

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
      const storage = getStorage();
      const sessionToken = storage?.getItem(SESSION_TOKEN_KEY);
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
      const storage = getStorage();
      const sessionToken = storage?.getItem(SESSION_TOKEN_KEY);
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
    const storage = getStorage();
    storage?.removeItem(storageKey);

    if (API_BASE_URL && userId) {
      const sessionToken = storage?.getItem(SESSION_TOKEN_KEY);
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
      // Parse date string directly — avoids UTC-midnight timezone shift
      // new Date("2026-04-01") = UTC midnight = March 31 in US timezones
      const [y, m] = e.date.split("-").map(Number);
      return y === year && m === month;
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
