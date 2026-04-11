import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Expense, CATEGORY_COLORS, Category } from "@/hooks/useExpenses";

interface SpendingChartProps {
  expenses: Expense[];
  totalByCategory: Partial<Record<Category, number>>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) return (
    <div className="glass rounded-lg px-3 py-2 shadow-elevated border border-border">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-mono font-semibold text-primary">${payload[0]?.value?.toFixed(2)}</p>
    </div>
  );
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) return (
    <div className="glass rounded-lg px-3 py-2 shadow-elevated border border-border">
      <p className="text-xs text-muted-foreground">{payload[0].name}</p>
      <p className="text-sm font-mono font-semibold">${payload[0].value?.toFixed(2)}</p>
    </div>
  );
  return null;
};

export function SpendingChart({ expenses, totalByCategory }: SpendingChartProps) {
  const today = new Date();
  const dailyData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().split("T")[0];
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      amount: expenses.filter((e) => e.date === dateStr).reduce((s, e) => s + e.amount, 0),
    };
  });

  const pieData = Object.entries(totalByCategory)
    .map(([cat, val]) => ({ name: cat, value: val as number }))
    .sort((a, b) => b.value - a.value).slice(0, 6);

  const GRID = "hsl(240 6% 13%)";
  const TICK = "hsl(220 8% 40%)";

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-bold mb-4" style={{fontFamily:"'Syne',sans-serif"}}>Daily Spending — Last 14 Days</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(185,100%,50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(185,100%,50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tick={{ fill: TICK, fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fill: TICK, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="amount" stroke="hsl(185,100%,50%)" strokeWidth={2}
              fill="url(#cyanGrad)" dot={false} activeDot={{ r: 4, fill: "hsl(185,100%,60%)", strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-bold mb-4" style={{fontFamily:"'Syne',sans-serif"}}>Spending by Category</h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[entry.name as Category] || "hsl(220 8% 40%)"} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend iconType="circle" iconSize={7}
                formatter={(v) => <span style={{ color: "hsl(220 8% 55%)", fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-8 text-center text-muted-foreground text-sm">No data yet</div>
        )}
      </div>
    </div>
  );
}
