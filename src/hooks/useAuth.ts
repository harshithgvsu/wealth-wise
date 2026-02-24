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

interface AuthResponse {
  success: boolean;
  error?: string;
  user?: UserProfile;
  token?: string;
}

const USERS_KEY = "spendwise_users";
const SESSION_KEY = "spendwise_session";
const SESSION_TOKEN_KEY = "spendwise_session_token";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");

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

async function callAuthEndpoint(path: string, init: RequestInit): Promise<AuthResponse | null> {
  if (!API_BASE_URL) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: text || "Request failed" };
    }

    return (await res.json()) as AuthResponse;
  } catch {
    return null;
  }
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

  useEffect(() => {
    if (!API_BASE_URL) return;

    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!sessionToken) return;

    fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("invalid session");
        return (await res.json()) as AuthResponse;
      })
      .then((data) => {
        if (!data.success || !data.user) throw new Error(data.error || "invalid session");
        const users = getUsers();
        users[data.user.id] = {
          ...data.user,
          passwordHash: users[data.user.id]?.passwordHash || "",
        };
        saveUsers(users);
        localStorage.setItem(SESSION_KEY, data.user.id);
        setAuthState({ user: data.user, isLoggedIn: true });
      })
      .catch(() => {
        localStorage.removeItem(SESSION_TOKEN_KEY);
      });
  }, []);

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

  const signup = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    const remote = await callAuthEndpoint("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });

    if (remote) {
      if (!remote.success || !remote.user) return { success: false, error: remote.error || "Signup failed" };
      const users = getUsers();
      users[remote.user.id] = { ...remote.user, passwordHash: simpleHash(password) };
      saveUsers(users);
      localStorage.setItem(SESSION_KEY, remote.user.id);
      if (remote.token) localStorage.setItem(SESSION_TOKEN_KEY, remote.token);
      setAuthState({ user: remote.user, isLoggedIn: true });
      return { success: true };
    }

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

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const remote = await callAuthEndpoint("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (remote) {
      if (!remote.success || !remote.user) return { success: false, error: remote.error || "Invalid email or password." };
      const users = getUsers();
      users[remote.user.id] = { ...remote.user, passwordHash: simpleHash(password) };
      saveUsers(users);
      localStorage.setItem(SESSION_KEY, remote.user.id);
      if (remote.token) localStorage.setItem(SESSION_TOKEN_KEY, remote.token);
      setAuthState({ user: remote.user, isLoggedIn: true });
      return { success: true };
    }

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
    localStorage.removeItem(SESSION_TOKEN_KEY);
    setAuthState({ user: null, isLoggedIn: false });
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Omit<UserProfile, "id" | "email" | "createdAt">>) => {
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

    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (API_BASE_URL && authState.user) {
      await fetch(`${API_BASE_URL}/users/${authState.user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify(updates),
      }).catch(() => undefined);
    }
  }, [authState.user]);

  const resetPassword = useCallback(async (email: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const remote = await callAuthEndpoint("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, newPassword }),
    });

    if (remote) {
      if (!remote.success) return { success: false, error: remote.error || "No account found with that email." };
    }

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
