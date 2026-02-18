import { useState, useEffect } from "react";

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

const STORAGE_KEY = (userId?: string) => `wealthwise_expenses_${userId || "default"}`;

const SAMPLE_EXPENSES: Expense[] = [
  { id: "s1", amount: 52.3, category: "Food & Dining", description: "Grocery store", date: "2026-02-01", createdAt: 1 },
  { id: "s2", amount: 18.5, category: "Transport", description: "Uber ride", date: "2026-02-02", createdAt: 2 },
  { id: "s3", amount: 120.0, category: "Bills & Utilities", description: "Electricity bill", date: "2026-02-03", createdAt: 3 },
  { id: "s4", amount: 35.0, category: "Food & Dining", description: "Restaurant dinner", date: "2026-02-04", createdAt: 4 },
  { id: "s5", amount: 89.99, category: "Shopping", description: "Clothing online", date: "2026-02-05", createdAt: 5 },
  { id: "s6", amount: 15.0, category: "Entertainment", description: "Netflix + Spotify", date: "2026-02-06", createdAt: 6 },
  { id: "s7", amount: 42.0, category: "Health", description: "Pharmacy", date: "2026-02-07", createdAt: 7 },
  { id: "s8", amount: 28.0, category: "Food & Dining", description: "Coffee shop week", date: "2026-02-08", createdAt: 8 },
  { id: "s9", amount: 60.0, category: "Transport", description: "Monthly pass", date: "2026-02-10", createdAt: 9 },
  { id: "s10", amount: 75.0, category: "Shopping", description: "Home supplies", date: "2026-02-12", createdAt: 10 },
  { id: "s11", amount: 22.5, category: "Food & Dining", description: "Lunch x3", date: "2026-02-13", createdAt: 11 },
  { id: "s12", amount: 200.0, category: "Bills & Utilities", description: "Internet + phone", date: "2026-02-14", createdAt: 12 },
  { id: "s13", amount: 14.0, category: "Entertainment", description: "Movie tickets", date: "2026-02-15", createdAt: 13 },
  { id: "s14", amount: 65.0, category: "Food & Dining", description: "Weekly groceries", date: "2026-02-16", createdAt: 14 },
  { id: "s15", amount: 30.0, category: "Education", description: "Online course", date: "2026-02-17", createdAt: 15 },
];

export function useExpenses(userId?: string) {
  const storageKey = STORAGE_KEY(userId);
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) return parsed;
      }
    } catch {}
    return SAMPLE_EXPENSES;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(expenses));
  }, [expenses, storageKey]);

  const addExpense = (expense: Omit<Expense, "id" | "createdAt">) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const getMonthExpenses = (year: number, month: number) => {
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  };

  const getTotalByCategory = (exps: Expense[]) => {
    const map: Partial<Record<Category, number>> = {};
    for (const e of exps) {
      map[e.category] = (map[e.category] || 0) + e.amount;
    }
    return map;
  };

  const getDailyTotals = (exps: Expense[]) => {
    const map: Record<string, number> = {};
    for (const e of exps) {
      map[e.date] = (map[e.date] || 0) + e.amount;
    }
    return map;
  };

  return {
    expenses,
    addExpense,
    deleteExpense,
    getMonthExpenses,
    getTotalByCategory,
    getDailyTotals,
  };
}
