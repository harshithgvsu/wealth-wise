import { useState, useEffect, useCallback } from "react";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  grossMonthlyIncome: number;
  netMonthlyIncome: number;
  health401kMonthly: number;
  otherPreTaxBenefits: number;
  rentMortgage: number;
  carPayment: number;
  insurancePremiums: number;
  subscriptions: number;
  otherFixedExpenses: number;
  savingsGoalPercent: number;
  investmentGoal: "retirement" | "property" | "emergency" | "growth" | "other";
  riskTolerance: "conservative" | "moderate" | "aggressive";
  investmentHorizonYears: number;
  createdAt: number;
}

export interface AuthState {
  user: UserProfile | null;
  isLoggedIn: boolean;
}

const USERS_KEY = "wealthwise_users";
const SESSION_KEY = "wealthwise_session";

function getUsers(): Record<string, UserProfile & { passwordHash: string }> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, UserProfile & { passwordHash: string }>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => {
    try {
      const sessionId = localStorage.getItem(SESSION_KEY);
      if (sessionId) {
        const users = getUsers();
        const user = users[sessionId];
        if (user) {
          const { passwordHash: _, ...profile } = user;
          return { user: profile, isLoggedIn: true };
        }
      }
    } catch {}
    return { user: null, isLoggedIn: false };
  });

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) {
        if (!e.newValue) {
          setAuthState({ user: null, isLoggedIn: false });
        } else {
          const users = getUsers();
          const user = users[e.newValue];
          if (user) {
            const { passwordHash: _, ...profile } = user;
            setAuthState({ user: profile, isLoggedIn: true });
          }
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const signup = useCallback((email: string, password: string, name: string): { success: boolean; error?: string } => {
    const users = getUsers();
    const existing = Object.values(users).find((u) => u.email === email);
    if (existing) return { success: false, error: "Email already registered. Please log in." };

    const id = crypto.randomUUID();
    const newUser: UserProfile & { passwordHash: string } = {
      id,
      email,
      name,
      passwordHash: simpleHash(password),
      grossMonthlyIncome: 0,
      netMonthlyIncome: 0,
      health401kMonthly: 0,
      otherPreTaxBenefits: 0,
      rentMortgage: 0,
      carPayment: 0,
      insurancePremiums: 0,
      subscriptions: 0,
      otherFixedExpenses: 0,
      savingsGoalPercent: 20,
      investmentGoal: "retirement",
      riskTolerance: "moderate",
      investmentHorizonYears: 20,
      createdAt: Date.now(),
    };
    users[id] = newUser;
    saveUsers(users);
    localStorage.setItem(SESSION_KEY, id);
    const { passwordHash: _, ...profile } = newUser;
    setAuthState({ user: profile, isLoggedIn: true });
    return { success: true };
  }, []);

  const login = useCallback((email: string, password: string): { success: boolean; error?: string } => {
    const users = getUsers();
    const userEntry = Object.values(users).find(
      (u) => u.email === email && u.passwordHash === simpleHash(password)
    );
    if (!userEntry) return { success: false, error: "Invalid email or password." };
    localStorage.setItem(SESSION_KEY, userEntry.id);
    const { passwordHash: _, ...profile } = userEntry;
    setAuthState({ user: profile, isLoggedIn: true });
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setAuthState({ user: null, isLoggedIn: false });
  }, []);

  const updateProfile = useCallback((updates: Partial<Omit<UserProfile, "id" | "email" | "createdAt">>) => {
    setAuthState((prev) => {
      if (!prev.user) return prev;
      const users = getUsers();
      const current = users[prev.user.id];
      if (!current) return prev;
      const updated = { ...current, ...updates };
      users[prev.user.id] = updated;
      saveUsers(users);
      const { passwordHash: _, ...profile } = updated;
      return { user: profile, isLoggedIn: true };
    });
  }, []);

  const resetPassword = useCallback((email: string, newPassword: string): { success: boolean; error?: string } => {
    const users = getUsers();
    const userEntry = Object.entries(users).find(([, u]) => u.email === email);
    if (!userEntry) return { success: false, error: "No account found with that email." };
    const [id, user] = userEntry;
    users[id] = { ...user, passwordHash: simpleHash(newPassword) };
    saveUsers(users);
    return { success: true };
  }, []);

  return { ...authState, signup, login, logout, updateProfile, resetPassword };
}
