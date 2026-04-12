import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, TrendingDown, PieChart, Calendar } from "lucide-react";
import { getDb } from "@/lib/db";
import { transactions, projects } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

async function getTransactions() {
  const db = getDb();
  try {
    const txList = await db.select().from(transactions);
    const projectList = await db.select().from(projects);
    const projectMap = new Map(projectList.map(p => [p.id, p]));
    return txList.map(tx => ({
      ...tx,
      projectName: projectMap.get(tx.projectId)?.name || "Unknown",
      budget: projectMap.get(tx.projectId)?.budget || 0,
    }));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

async function getMonthlyData() {
  const db = getDb();
  try {
    const txList = await db.select().from(transactions);
  
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      monthlyData[key] = { income: 0, expense: 0 };
    }
    
    txList.forEach(tx => {
      const month = tx.date.slice(0, 7);
      if (monthlyData[month]) {
        if (tx.type === "income") {
          monthlyData[month].income += tx.amount;
        } else {
          monthlyData[month].expense += tx.amount;
        }
      }
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month: new Date(month + "-01").toLocaleDateString("id-ID", { month: "short" }),
      ...data,
    }));
  } catch (error) {
    console.error("Error fetching monthly data:", error);
    return [];
  }
}

export default async function KeuanganPage() {
  const transactionsList = await getTransactions();
  const monthlyData = await getMonthlyData();
  
  const totalIncome = transactionsList
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactionsList
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const unpaidExpenses = transactionsList
    .filter(t => t.type === "expense" && t.paymentStatus !== "lunas")
    .reduce((sum, t) => sum + (t.amount - (t.paidAmount || 0)), 0);
  
  const netBalance = totalIncome - totalExpense - unpaidExpenses;
  
  const projectStats = await getDb().select().from(projects);
  const totalBudget = projectStats.reduce((sum, p) => sum + p.budget, 0);
  const usedBudget = totalExpense;
  const budgetUsagePercent = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0;
  
  const maxMonthly = Math.max(...monthlyData.map(m => Math.max(m.income, m.expense)));

  return (
    <div className="p-10 pt-24 space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-on-surface">
          Keuangan
        </h1>
        <p className="text-zinc-500 mt-1">
          Cash flow and financial overview
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Total Income</span>
          </div>
          <p className="text-2xl font-headline font-bold text-emerald-500">
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalIncome)}
          </p>
        </div>

        <div className="bg-surface-container-low p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Total Expense</span>
          </div>
          <p className="text-2xl font-headline font-bold text-red-500">
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalExpense)}
          </p>
        </div>

        <div className="bg-surface-container-low p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-yellow-500" />
            </div>
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Accounts Payable</span>
          </div>
          <p className="text-2xl font-headline font-bold text-yellow-500">
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(unpaidExpenses)}
          </p>
        </div>

        <div className="bg-surface-container-low p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Net Balance</span>
          </div>
          <p className={`text-2xl font-headline font-bold ${netBalance >= 0 ? "text-primary" : "text-red-500"}`}>
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(netBalance)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-low p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-headline font-bold text-on-surface">
              Monthly Cash Flow
            </h2>
            <Calendar className="w-5 h-5 text-zinc-500" />
          </div>
          
          <div className="space-y-4">
            {monthlyData.map((month) => (
              <div key={month.month} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400 font-bold uppercase">{month.month}</span>
                  <div className="flex gap-4">
                    <span className="text-emerald-500">
                      +{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0, notation: "compact" }).format(month.income)}
                    </span>
                    <span className="text-red-500">
                      -{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0, notation: "compact" }).format(month.expense)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 h-3">
                  {maxMonthly > 0 && (
                    <>
                      <div 
                        className="bg-emerald-500 rounded-l-full"
                        style={{ width: `${(month.income / maxMonthly) * 100}%` }}
                      />
                      <div 
                        className="bg-red-500 rounded-r-full"
                        style={{ width: `${(month.expense / maxMonthly) * 100}%` }}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-6 mt-6 pt-4 border-t border-surface-container-highest">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-zinc-500">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-zinc-500">Expense</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-headline font-bold text-on-surface">
              Budget Overview
            </h2>
            <PieChart className="w-5 h-5 text-zinc-500" />
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-zinc-400">Total Budget</span>
                <span className="text-on-surface font-headline font-bold">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalBudget)}
                </span>
              </div>
              <div className="h-4 bg-surface-container-highest rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    budgetUsagePercent > 80 ? "bg-red-500" : budgetUsagePercent > 60 ? "bg-yellow-500" : "gold-gradient"
                  }`}
                  style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-zinc-500">Used: {budgetUsagePercent.toFixed(1)}%</span>
                <span className="text-zinc-500">
                  Remaining: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalBudget - usedBudget)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-high p-4 rounded-lg">
                <span className="text-xs text-zinc-500 block mb-1">Used</span>
                <span className="text-xl font-headline font-bold text-on-surface">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0, notation: "compact" }).format(usedBudget)}
                </span>
              </div>
              <div className="bg-surface-container-high p-4 rounded-lg">
                <span className="text-xs text-zinc-500 block mb-1">Remaining</span>
                <span className="text-xl font-headline font-bold text-primary">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0, notation: "compact" }).format(totalBudget - usedBudget)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low p-6 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-headline font-bold text-on-surface">
            Recent Transactions
          </h2>
          <Link href="/transactions" className="text-sm text-primary hover:underline">
            Lihat Semua
          </Link>
        </div>

        {transactionsList.length === 0 ? (
          <p className="text-center text-zinc-500 py-8">Belum ada transaksi</p>
        ) : (
          <div className="space-y-3">
            {transactionsList.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-surface-container-high rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tx.type === "income" ? "bg-emerald-500/10" : "bg-red-500/10"
                  }`}>
                    {tx.type === "income" ? (
                      <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-on-surface font-headline font-bold">{tx.projectName}</p>
                    <p className="text-xs text-zinc-500">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-headline font-bold ${
                    tx.type === "income" ? "text-emerald-500" : "text-red-500"
                  }`}>
                    {tx.type === "income" ? "+" : "-"} {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(tx.amount)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    tx.paymentStatus === "lunas" ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    {tx.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}