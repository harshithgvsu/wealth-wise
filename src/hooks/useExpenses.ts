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

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO date string YYYY-MM-DD
  createdAt: number;
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

  // Re-read from localStorage when userId (and thus storageKey) changes
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
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
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
