import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number; // percent change
  icon: React.ReactNode;
  variant?: "default" | "primary" | "gold" | "danger";
  delay?: number;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = "default",
  delay = 0,
}: StatCardProps) {
  const borderColor = {
    default: "border-navy-border",
    primary: "border-emerald/30",
    gold: "border-gold/30",
    danger: "border-destructive/30",
  }[variant];

  const iconBg = {
    default: "bg-navy-surface text-muted-foreground",
    primary: "bg-emerald/15 text-emerald",
    gold: "bg-gold/15 text-gold",
    danger: "bg-destructive/15 text-destructive",
  }[variant];

  const valueCx = {
    default: "text-foreground",
    primary: "text-gradient-primary",
    gold: "text-gradient-gold",
    danger: "text-destructive",
  }[variant];

  const TrendIcon =
    trend === undefined || trend === 0
      ? Minus
      : trend > 0
      ? TrendingUp
      : TrendingDown;

  const trendCx =
    trend === undefined || trend === 0
      ? "text-muted-foreground"
      : trend > 0
      ? "text-destructive"
      : "text-emerald";

  return (
    <div
      className={`glass-card rounded-xl p-5 border ${borderColor} animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold font-mono ${valueCx}`}>{value}</p>
      {(subtitle || trend !== undefined) && (
        <div className="flex items-center gap-1.5 mt-1.5">
          {trend !== undefined && (
            <TrendIcon size={13} className={trendCx} />
          )}
          <span className={`text-xs ${trend !== undefined ? trendCx : "text-muted-foreground"}`}>
            {trend !== undefined
              ? `${trend > 0 ? "+" : ""}${trend.toFixed(1)}% vs last month`
              : subtitle}
          </span>
        </div>
      )}
    </div>
  );
}
