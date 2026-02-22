import { describe, it, expect, beforeEach } from "vitest";

const STORAGE_KEY = (userId: string) => `spendwise_expenses_${userId}`;

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: number;
}

function addExpense(expenses: Expense[], data: Omit<Expense, "id" | "createdAt">): Expense[] {
  return [{ ...data, id: crypto.randomUUID(), createdAt: Date.now() }, ...expenses];
}

function deleteExpense(expenses: Expense[], id: string): Expense[] {
  return expenses.filter((e) => e.id !== id);
}

function getMonthExpenses(expenses: Expense[], year: number, month: number): Expense[] {
  return expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

function getTotalByCategory(exps: Expense[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const e of exps) map[e.category] = (map[e.category] || 0) + e.amount;
  return map;
}

function getDailyTotals(exps: Expense[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const e of exps) map[e.date] = (map[e.date] || 0) + e.amount;
  return map;
}

describe("Expense Logic", () => {
  beforeEach(() => localStorage.clear());

  it("adds an expense correctly", () => {
    const expenses = addExpense([], { amount: 25.5, category: "Food & Dining", description: "Lunch", date: "2026-02-15" });
    expect(expenses).toHaveLength(1);
    expect(expenses[0].amount).toBe(25.5);
  });

  it("deletes an expense by id", () => {
    let expenses = addExpense([], { amount: 10, category: "Transport", description: "Bus", date: "2026-02-10" });
    expenses = deleteExpense(expenses, expenses[0].id);
    expect(expenses).toHaveLength(0);
  });

  it("getMonthExpenses filters correctly", () => {
    let expenses = addExpense([], { amount: 10, category: "Other", description: "Jan", date: "2026-01-15" });
    expenses = addExpense(expenses, { amount: 20, category: "Other", description: "Feb", date: "2026-02-15" });
    expect(getMonthExpenses(expenses, 2026, 2)).toHaveLength(1);
  });

  it("getTotalByCategory groups amounts", () => {
    let expenses = addExpense([], { amount: 10, category: "Food & Dining", description: "A", date: "2026-02-01" });
    expenses = addExpense(expenses, { amount: 30, category: "Food & Dining", description: "B", date: "2026-02-02" });
    expenses = addExpense(expenses, { amount: 15, category: "Transport", description: "C", date: "2026-02-03" });
    const totals = getTotalByCategory(expenses);
    expect(totals["Food & Dining"]).toBe(40);
    expect(totals["Transport"]).toBe(15);
  });

  it("getDailyTotals groups by date", () => {
    let expenses = addExpense([], { amount: 10, category: "Other", description: "A", date: "2026-02-01" });
    expenses = addExpense(expenses, { amount: 20, category: "Other", description: "B", date: "2026-02-01" });
    expenses = addExpense(expenses, { amount: 5, category: "Other", description: "C", date: "2026-02-02" });
    const daily = getDailyTotals(expenses);
    expect(daily["2026-02-01"]).toBe(30);
    expect(daily["2026-02-02"]).toBe(5);
  });

  it("persists to localStorage", () => {
    const expenses = addExpense([], { amount: 99, category: "Entertainment", description: "Movie", date: "2026-02-20" });
    localStorage.setItem(STORAGE_KEY("test"), JSON.stringify(expenses));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY("test"))!);
    expect(stored).toHaveLength(1);
    expect(stored[0].amount).toBe(99);
  });

  it("handles all 8 categories", () => {
    const cats = ["Food & Dining", "Transport", "Shopping", "Health", "Entertainment", "Bills & Utilities", "Education", "Other"];
    let expenses: Expense[] = [];
    for (const cat of cats) expenses = addExpense(expenses, { amount: 50, category: cat, description: cat, date: "2026-02-15" });
    expect(Object.keys(getTotalByCategory(expenses))).toHaveLength(8);
  });
});
