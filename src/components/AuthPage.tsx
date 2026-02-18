import { useState } from "react";
import { Eye, EyeOff, TrendingUp, Mail, Lock, User, ArrowRight } from "lucide-react";

interface AuthPageProps {
  onLogin: (email: string, password: string) => { success: boolean; error?: string };
  onSignup: (email: string, password: string, name: string) => { success: boolean; error?: string };
}

export function AuthPage({ onLogin, onSignup }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));

    let result: { success: boolean; error?: string };
    if (mode === "login") {
      result = onLogin(email, password);
    } else {
      if (!name.trim()) { setError("Please enter your name."); setLoading(false); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); setLoading(false); return; }
      result = onSignup(email, password, name);
    }

    if (!result.success) setError(result.error || "Something went wrong.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3 animate-in-up">
        <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center pulse-glow">
          <TrendingUp size={28} className="text-primary-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Wealth<span className="text-gradient-primary">Wise</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Your AI-powered financial companion</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm glass-card rounded-2xl p-6 animate-in-up" style={{ animationDelay: "80ms" }}>
        {/* Tab switcher */}
        <div className="flex rounded-xl overflow-hidden mb-6 bg-muted p-1 gap-1">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === m
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                className="w-full bg-muted border border-border rounded-lg pl-9 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-all disabled:opacity-60 mt-2"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                {mode === "login" ? "Sign In" : "Create Account"}
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {mode === "login" && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            New here?{" "}
            <button onClick={() => setMode("signup")} className="text-primary hover:underline font-medium">
              Create a free account
            </button>
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center max-w-xs">
        Your data stays on your device. No servers, no sharing.
      </p>
    </div>
  );
}
