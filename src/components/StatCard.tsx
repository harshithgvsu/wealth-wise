import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  variant?: "default" | "primary" | "gold" | "danger";
  delay?: number;
}

export function StatCard({ title, value, subtitle, trend, icon, variant = "default", delay = 0 }: StatCardProps) {
  const borderCx = {
    default: "border-border",
    primary: "border-primary/20",
    gold: "border-amber-400/20",
    danger: "border-destructive/20",
  }[variant];

  const iconBg = {
    default: "bg-secondary text-muted-foreground",
    primary: "bg-primary/15 text-primary",
    gold: "bg-amber-400/15 text-amber-400",
    danger: "bg-destructive/15 text-destructive",
  }[variant];

  const valueCx = {
    default: "text-foreground",
    primary: "text-gradient-primary",
    gold: "text-gradient-gold",
    danger: "text-destructive",
  }[variant];

  const TrendIcon = trend === undefined || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  const trendCx = trend === undefined || trend === 0 ? "text-muted-foreground" : trend > 0 ? "text-destructive" : "text-primary";

  return (
    <div className={`glass rounded-xl p-4 border ${borderCx} animate-fade-in`} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
        <div className={`p-1.5 rounded-lg ${iconBg}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold font-mono ${valueCx}`}>{value}</p>
      {(subtitle || trend !== undefined) && (
        <div className="flex items-center gap-1.5 mt-1.5">
          {trend !== undefined && <TrendIcon size={12} className={trendCx} />}
          <span className={`text-xs ${trend !== undefined ? trendCx : "text-muted-foreground"}`}>
            {trend !== undefined ? `${trend > 0 ? "+" : ""}${trend.toFixed(1)}% vs last month` : subtitle}
          </span>
        </div>
      )}
    </div>
  );
}
