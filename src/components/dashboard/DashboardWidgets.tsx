"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Legend } from "recharts";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
  id: string;
  projectId: string;
  type: string;
  amount: number;
  date: string;
  paymentStatus: string;
  projectName?: string;
}

interface DashboardChartProps {
  monthlyExpenseData: Record<string, number>;
  monthlyIncomeData?: Record<string, number>;
  recentTransactions?: Transaction[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container-highest p-3 rounded-lg shadow-xl border border-zinc-700">
        <p className="text-zinc-400 text-xs font-bold uppercase mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className={`text-sm font-bold ${entry.color === '#10b981' ? 'text-emerald-500' : entry.color === '#ef4444' ? 'text-red-500' : 'text-primary'}`}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function DashboardChart({ monthlyExpenseData, monthlyIncomeData = {} }: DashboardChartProps) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  
  const data = months.map((month, index) => {
    const monthKey = `${new Date().getFullYear()}-${String(index + 1).padStart(2, "0")}`;
    return {
      name: month,
      expense: monthlyExpenseData[monthKey] || 0,
      income: monthlyIncomeData[monthKey] || 0,
    };
  }).filter((_, idx) => idx <= currentMonth);

  const last6Data = data.slice(-6);

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={last6Data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#71717a" 
            fontSize={11} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#71717a" 
            fontSize={11} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => <span className="text-zinc-400 text-xs uppercase font-bold tracking-widest">{value}</span>}
          />
          <Area 
            type="monotone" 
            dataKey="income" 
            name="Pemasukan"
            stroke="#10b981" 
            fill="url(#incomeGradient)" 
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="expense" 
            name="Pengeluaran"
            stroke="#ef4444" 
            fill="url(#expenseGradient)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500 text-sm">Belum ada transaksi</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.slice(0, 5).map((tx) => (
        <Link
          key={tx.id}
          href={`/transactions/${tx.id}`}
          className="flex items-center justify-between p-3 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              tx.type === "income" ? "bg-emerald-500/10" : "bg-red-500/10"
            }`}>
              {tx.type === "income" ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div>
              <p className="text-sm text-on-surface font-medium">{tx.projectName || "Proyek"}</p>
              <p className="text-xs text-zinc-500">{tx.date}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-bold ${
              tx.type === "income" ? "text-emerald-500" : "text-red-500"
            }`}>
              {tx.type === "income" ? "+" : "-"} {formatCurrency(tx.amount)}
            </p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              tx.paymentStatus === "lunas" ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-500"
            }`}>
              {tx.paymentStatus}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function StatsOverview({ 
  totalProjects, 
  totalTransactions, 
  totalEntities 
}: { 
  totalProjects: number; 
  totalTransactions: number; 
  totalEntities: number;
}) {
  const stats = [
    { label: "Total Proyek", value: totalProjects, color: "text-primary" },
    { label: "Total Transaksi", value: totalTransactions, color: "text-emerald-500" },
    { label: "Total Entitas", value: totalEntities, color: "text-blue-500" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface-container-low p-4 rounded-lg text-center">
          <p className={`text-2xl font-headline font-bold ${stat.color}`}>
            {stat.value}
          </p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
