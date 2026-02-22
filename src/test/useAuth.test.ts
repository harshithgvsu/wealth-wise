import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/useAuth";

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock crypto.randomUUID
vi.stubGlobal("crypto", { randomUUID: () => "test-uuid-" + Math.random().toString(36).slice(2, 8) });

describe("useAuth", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("starts logged out with no session", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("signup creates user and logs in", () => {
    const { result } = renderHook(() => useAuth());
    let res: { success: boolean; error?: string };
    act(() => { res = result.current.signup("a@b.com", "pass123", "Alex"); });
    expect(res!.success).toBe(true);
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.user?.name).toBe("Alex");
    expect(result.current.user?.email).toBe("a@b.com");
  });

  it("prevents duplicate email signup", () => {
    const { result } = renderHook(() => useAuth());
    act(() => { result.current.signup("a@b.com", "pass123", "Alex"); });
    // Logout and try signup again with same email
    act(() => { result.current.logout(); });
    let res: { success: boolean; error?: string };
    act(() => { res = result.current.signup("a@b.com", "pass456", "Bob"); });
    expect(res!.success).toBe(false);
    expect(res!.error).toContain("already registered");
  });

  it("login with correct credentials works", () => {
    const { result } = renderHook(() => useAuth());
    act(() => { result.current.signup("a@b.com", "pass123", "Alex"); });
    act(() => { result.current.logout(); });
    let res: { success: boolean; error?: string };
    act(() => { res = result.current.login("a@b.com", "pass123"); });
    expect(res!.success).toBe(true);
    expect(result.current.isLoggedIn).toBe(true);
  });

  it("login with wrong password fails", () => {
    const { result } = renderHook(() => useAuth());
    act(() => { result.current.signup("a@b.com", "pass123", "Alex"); });
    act(() => { result.current.logout(); });
    let res: { success: boolean; error?: string };
    act(() => { res = result.current.login("a@b.com", "wrongpass"); });
    expect(res!.success).toBe(false);
    expect(res!.error).toContain("Invalid");
  });

  it("logout clears session", () => {
    const { result } = renderHook(() => useAuth());
    act(() => { result.current.signup("a@b.com", "pass123", "Alex"); });
    expect(result.current.isLoggedIn).toBe(true);
    act(() => { result.current.logout(); });
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("updateProfile persists changes", () => {
    const { result } = renderHook(() => useAuth());
    act(() => { result.current.signup("a@b.com", "pass123", "Alex"); });
    act(() => { result.current.updateProfile({ grossMonthlyIncome: 5000, netMonthlyIncome: 4000 }); });
    expect(result.current.user?.grossMonthlyIncome).toBe(5000);
    expect(result.current.user?.netMonthlyIncome).toBe(4000);
  });

  it("resetPassword allows login with new password", () => {
    const { result } = renderHook(() => useAuth());
    act(() => { result.current.signup("a@b.com", "pass123", "Alex"); });
    act(() => { result.current.logout(); });
    let resetRes: { success: boolean; error?: string };
    act(() => { resetRes = result.current.resetPassword("a@b.com", "newpass456"); });
    expect(resetRes!.success).toBe(true);
    // Old password should fail
    let loginRes: { success: boolean; error?: string };
    act(() => { loginRes = result.current.login("a@b.com", "pass123"); });
    expect(loginRes!.success).toBe(false);
    // New password should work
    act(() => { loginRes = result.current.login("a@b.com", "newpass456"); });
    expect(loginRes!.success).toBe(true);
  });

  it("resetPassword fails for unknown email", () => {
    const { result } = renderHook(() => useAuth());
    let res: { success: boolean; error?: string };
    act(() => { res = result.current.resetPassword("nobody@test.com", "pass123"); });
    expect(res!.success).toBe(false);
    expect(res!.error).toContain("No account");
  });

  it("session persists across hook re-render", () => {
    const { result: r1 } = renderHook(() => useAuth());
    act(() => { r1.current.signup("a@b.com", "pass123", "Alex"); });
    const userId = r1.current.user?.id;
    // Simulate re-mount by rendering a new hook (localStorage still has session)
    const { result: r2 } = renderHook(() => useAuth());
    expect(r2.current.isLoggedIn).toBe(true);
    expect(r2.current.user?.id).toBe(userId);
  });
});
