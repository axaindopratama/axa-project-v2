"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface Transaction {
  id: string;
  projectId: string;
  projectName: string;
  category?: string;
  type: string;
  amount: number;
}

interface Project {
  id: string;
  name: string;
  budget: number;
}

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"];

type TooltipPayloadEntry = {
  color?: string;
  name?: string;
  value?: number;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container-highest p-3 rounded-lg shadow-xl border border-zinc-700">
        <p className="text-zinc-400 text-xs font-bold uppercase mb-1">{label}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className={`text-sm font-bold ${entry.color === '#10b981' ? 'text-emerald-500' : entry.color === '#ef4444' ? 'text-red-500' : 'text-primary'}`}>
            {entry.name}: {formatCurrency(entry.value || 0)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function CashFlowChart({ data }: { data: MonthlyData[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGradientK" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGradientK" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
          <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: "10px" }} formatter={(value) => <span className="text-zinc-400 text-xs">{value}</span>} />
          <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#10b981" fill="url(#incomeGradientK)" strokeWidth={2} />
          <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#ef4444" fill="url(#expenseGradientK)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpenseByCategory({ transactions }: { transactions: Transaction[] }) {
  const expenseByCategory = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      const cat = t.category || "Lainnya";
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const data = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Belum ada data pengeluaran</p>
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(value as number)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BudgetUsageChart({ projects }: { projects: Project[] }) {
  const data = projects.map(p => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + "..." : p.name,
    budget: p.budget,
    used: 0,
  }));

  if (data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Belum ada proyek</p>
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" horizontal={false} />
          <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} />
          <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="budget" name="Budget" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NetCashFlowChart({ data }: { data: MonthlyData[] }) {
  const dataWithNet = data.map(d => ({
    ...d,
    net: d.income - d.expense,
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dataWithNet} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
          <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: "10px" }} formatter={(value) => <span className="text-zinc-400 text-xs">{value}</span>} />
          <Line type="monotone" dataKey="net" name="Net Cash Flow" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", strokeWidth: 2 }} />
          <Line type="monotone" dataKey="income" name="Pemasukan" stroke="#10b981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="expense" name="Pengeluaran" stroke="#ef4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
