import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, PieChart, BarChart3 } from "lucide-react";
import { getDb } from "@/lib/db";
import { transactions, projects } from "@/lib/db/schema";
import { CashFlowChart, ExpenseByCategory, BudgetUsageChart, NetCashFlowChart } from "@/components/dashboard/KeuanganCharts";

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
  return (
    <div className="p-4 sm:p-6 lg:p-10 pt-20 sm:pt-24 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface">
          Keuangan
        </h1>
        <p className="text-zinc-500 mt-1">
          Cash flow and financial overview
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low p-4 sm:p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Total Income</span>
          </div>
          <p className="text-xl sm:text-2xl font-headline font-bold text-emerald-500 break-words">
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalIncome)}
          </p>
        </div>

        <div className="bg-surface-container-low p-4 sm:p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Total Expense</span>
          </div>
          <p className="text-xl sm:text-2xl font-headline font-bold text-red-500 break-words">
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalExpense)}
          </p>
        </div>

        <div className="bg-surface-container-low p-4 sm:p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-yellow-500" />
            </div>
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Accounts Payable</span>
          </div>
          <p className="text-xl sm:text-2xl font-headline font-bold text-yellow-500 break-words">
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(unpaidExpenses)}
          </p>
        </div>

        <div className="bg-surface-container-low p-4 sm:p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Net Balance</span>
          </div>
          <p className={`text-xl sm:text-2xl font-headline font-bold break-words ${netBalance >= 0 ? "text-primary" : "text-red-500"}`}>
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(netBalance)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-low p-4 sm:p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-headline font-bold text-on-surface">
              Cash Flow Chart
            </h2>
            <BarChart3 className="w-5 h-5 text-zinc-500" />
          </div>
          <CashFlowChart data={monthlyData} />
        </div>

        <div className="bg-surface-container-low p-4 sm:p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-headline font-bold text-on-surface">
              Net Cash Flow
            </h2>
            <TrendingUp className="w-5 h-5 text-zinc-500" />
          </div>
          <NetCashFlowChart data={monthlyData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-low p-4 sm:p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-headline font-bold text-on-surface">
              Pengeluaran per Kategori
            </h2>
            <PieChart className="w-5 h-5 text-zinc-500" />
          </div>
          <ExpenseByCategory transactions={transactionsList} />
        </div>

        <div className="bg-surface-container-low p-4 sm:p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-headline font-bold text-on-surface">
              Budget per Proyek
            </h2>
            <BarChart3 className="w-5 h-5 text-zinc-500" />
          </div>
          <BudgetUsageChart projects={projectStats} />
        </div>
      </div>

      <div className="bg-surface-container-low p-4 sm:p-6 rounded-xl">
        <div className="flex items-center justify-between gap-2 mb-6">
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
              <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-surface-container-high rounded-lg">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tx.type === "income" ? "bg-emerald-500/10" : "bg-red-500/10"
                  }`}>
                    {tx.type === "income" ? (
                      <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-on-surface font-headline font-bold break-words">{tx.projectName}</p>
                    <p className="text-xs text-zinc-500">{tx.date}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
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