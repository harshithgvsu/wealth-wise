import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Expense, CATEGORY_COLORS, Category } from "@/hooks/useExpenses";

interface SpendingChartProps {
  expenses: Expense[];
  totalByCategory: Partial<Record<Category, number>>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card border border-navy-border rounded-lg px-3 py-2 shadow-elevated">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-mono font-semibold text-emerald">
          ${payload[0]?.value?.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card border border-navy-border rounded-lg px-3 py-2 shadow-elevated">
        <p className="text-xs text-muted-foreground">{payload[0].name}</p>
        <p className="text-sm font-mono font-semibold text-foreground">
          ${payload[0].value?.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export function SpendingChart({ expenses, totalByCategory }: SpendingChartProps) {
  // Build daily area chart data for last 14 days
  const today = new Date();
  const dailyData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().split("T")[0];
    const dayExps = expenses.filter((e) => e.date === dateStr);
    const total = dayExps.reduce((sum, e) => sum + e.amount, 0);
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      amount: total,
    };
  });

  // Pie chart data
  const pieData = Object.entries(totalByCategory)
    .map(([cat, val]) => ({ name: cat, value: val as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Daily spending trend */}
      <div className="glass-card border border-navy-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Daily Spending — Last 14 Days
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(152 76% 40%)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(152 76% 40%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="hsl(152 76% 40%)"
              strokeWidth={2}
              fill="url(#emeraldGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "hsl(152 76% 50%)", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown */}
      <div className="glass-card border border-navy-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Spending by Category
        </h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={CATEGORY_COLORS[entry.name as Category] || "hsl(215 20% 55%)"}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ color: "hsl(215 20% 65%)", fontSize: 11 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No data yet
          </div>
        )}
      </div>
    </div>
  );
}
