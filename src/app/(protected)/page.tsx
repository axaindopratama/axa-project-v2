import Link from "next/link";
import { Plus, TrendingUp, ChevronRight, Wallet as WalletIcon, Clock, Activity, Folder } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getDb } from "@/lib/db";
import { projects, transactions, entities } from "@/lib/db/schema";
import { DashboardChart, RecentTransactions, StatsOverview } from "@/components/dashboard/DashboardWidgets";
import { ExportPDFButton } from "@/components/dashboard/ExportPDF";
import { BudgetAlertsPanel } from "@/components/dashboard/BudgetAlerts";

export const dynamic = "force-dynamic";

async function getDashboardStats() {
  const db = getDb();
  try {
    const allProjects = await db.select().from(projects);
    const allTransactions = await db.select().from(transactions);
    const allEntities = await db.select().from(entities);
  
    const totalProjects = allProjects.length;
    const activeProjects = allProjects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
    
    const totalBudget = allProjects.reduce((sum, p) => sum + p.budget, 0);
    
    const totalSpent = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const unpaidExpenses = allTransactions
      .filter(t => t.type === 'expense' && t.paymentStatus !== 'lunas')
      .reduce((sum, t) => sum + (t.amount - (t.paidAmount || 0)), 0);
    
    const expensesByDate = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc: Record<string, number>, t) => {
        const monthKey = t.date.slice(0, 7);
        acc[monthKey] = (acc[monthKey] || 0) + t.amount;
        return acc;
      }, {});

    const incomeByDate = allTransactions
      .filter(t => t.type === 'income')
      .reduce((acc: Record<string, number>, t) => {
        const monthKey = t.date.slice(0, 7);
        acc[monthKey] = (acc[monthKey] || 0) + t.amount;
        return acc;
      }, {});
    
    const monthsWithData = Object.keys(expensesByDate).length;
    const avgMonthlySpend = monthsWithData > 0 ? totalSpent / monthsWithData : 0;
    const avgDailySpend = avgMonthlySpend / 30;
    
    const remainingBudget = totalBudget - totalSpent;
    const estimatedRunway = avgDailySpend > 0 ? Math.floor(remainingBudget / avgDailySpend) : 999;
    
    const budgetUsagePercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    
    const budgetAlerts: { projectId: string; projectName: string; percentage: number; type: "warning" | "critical"; spent: number; budget: number; remaining: number }[] = [];
    for (const project of allProjects) {
      const projectTx = allTransactions.filter(t => t.projectId === project.id && t.type === 'expense');
      const spent = projectTx.reduce((sum, t) => sum + t.amount, 0);
      const usage = project.budget > 0 ? (spent / project.budget) * 100 : 0;
      
      if (usage >= 80) {
        budgetAlerts.push({ projectId: project.id, projectName: project.name, percentage: Math.round(usage), type: 'critical' as const, spent, budget: project.budget, remaining: project.budget - spent });
      } else if (usage >= 60) {
        budgetAlerts.push({ projectId: project.id, projectName: project.name, percentage: Math.round(usage), type: 'warning' as const, spent, budget: project.budget, remaining: project.budget - spent });
      }
    }

    const recentTransactions = allTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(tx => ({
        ...tx,
        projectName: allProjects.find(p => p.id === tx.projectId)?.name || "Unknown",
      }));
    
    return {
      totalProjects,
      activeProjects,
      totalBudget,
      totalSpent,
      totalIncome,
      unpaidExpenses,
      totalRemaining: remainingBudget,
      estimatedRunway: Math.max(0, estimatedRunway),
      avgDailySpend: Math.round(avgDailySpend),
      avgMonthlySpend: Math.round(avgMonthlySpend),
      budgetUsagePercent,
      budgetAlerts,
      projects: allProjects,
      monthlyExpenseData: expensesByDate,
      monthlyIncomeData: incomeByDate,
      recentTransactions,
      totalTransactions: allTransactions.length,
      totalEntities: allEntities.length,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalProjects: 0,
      activeProjects: 0,
      totalBudget: 0,
      totalSpent: 0,
      totalIncome: 0,
      unpaidExpenses: 0,
      totalRemaining: 0,
      estimatedRunway: 0,
      avgDailySpend: 0,
      avgMonthlySpend: 0,
      budgetUsagePercent: 0,
      budgetAlerts: [],
      projects: [],
      monthlyExpenseData: {},
      monthlyIncomeData: {},
      recentTransactions: [],
      totalTransactions: 0,
      totalEntities: 0,
    };
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  
  return (
    <div className="p-4 sm:p-6 lg:p-10 pt-20 sm:pt-24 space-y-6 sm:space-y-8">
      {/* Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.1em]">
          <span className="text-zinc-600">Dashboard</span>
          <ChevronRight className="w-3 h-3 text-zinc-700" />
          <span className="text-primary">Ringkasan Keuangan</span>
        </div>
        <ExportPDFButton targetId="dashboard-content" fileName="laporan-dashboard" />
      </div>

      <div id="dashboard-content">

      {/* Stats Overview */}
      <StatsOverview 
        totalProjects={stats.totalProjects}
        totalTransactions={stats.totalTransactions}
        totalEntities={stats.totalEntities}
      />

      {/* Hero Section */}
      <section className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* Main Stats */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
            <div>
              <p className="text-zinc-500 font-headline text-xs font-semibold uppercase tracking-[0.2em] mb-2">
                Total Saldo Tersedia
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-extrabold text-primary tracking-tighter leading-tight break-words">
                {formatCurrency(stats.totalRemaining)}
              </h1>
            </div>
            <div className="text-left sm:text-right">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="w-5 h-5" />
                <span className="text-xl font-headline font-bold">
                  {stats.budgetUsagePercent}%
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                Penggunaan Budget
              </p>
            </div>
          </div>

          {/* Interactive Chart */}
          <div className="bg-surface-container-low rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between mb-4 items-start gap-3">
              <h3 className="text-zinc-300 font-headline font-bold uppercase tracking-widest text-xs">
                Grafik Pengeluaran Bulanan
              </h3>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                    Pemasukan
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                    Pengeluaran
                  </span>
                </div>
              </div>
            </div>
            <DashboardChart 
              monthlyExpenseData={stats.monthlyExpenseData}
              monthlyIncomeData={stats.monthlyIncomeData}
            />
          </div>
        </div>

        {/* Side Cards */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Budget Alerts */}
          <BudgetAlertsPanel alerts={stats.budgetAlerts} />

          {/* Burn Rate */}
          <div className="bg-surface-container-low rounded-lg p-4 sm:p-6">
            <h3 className="text-zinc-500 font-headline font-bold uppercase tracking-widest text-[10px] mb-6">
              Prediksi Burn Rate
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 flex items-center justify-center rounded-full ${
                  stats.estimatedRunway < 30 ? 'bg-red-500/10 text-red-500' : stats.estimatedRunway < 60 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-primary/10 text-primary'
                }`}>
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                    Estimasi Runway
                  </p>
                  <p className={`text-2xl font-headline font-bold ${
                    stats.estimatedRunway < 30 ? 'text-red-500' : stats.estimatedRunway < 60 ? 'text-yellow-500' : 'text-on-surface'
                  }`}>
                    {stats.estimatedRunway === 999 ? '∞' : `${stats.estimatedRunway} Hari`}{" "}
                    <span className="text-zinc-600 font-normal text-sm">Sisa</span>
                  </p>
                </div>
              </div>
              <div className="p-4 bg-surface-container-high rounded border-l-2 border-primary/40">
                <p className="text-xs text-zinc-400">
                  Berdasarkan spending {formatCurrency(stats.avgDailySpend)}/hari
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-zinc-500">Rata-rata Harian</span>
                  <span className="text-primary">
                    {formatCurrency(stats.avgDailySpend)}
                  </span>
                </div>
                <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="w-[75%] h-full gold-gradient" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-panel rounded-lg p-4 sm:p-6 space-y-4">
            <h3 className="text-primary font-headline font-bold uppercase tracking-widest text-[10px]">
              Ringkasan Cepat
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded">
                <div className="flex items-center gap-3">
                  <Folder className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-300">Proyek Aktif</span>
                </div>
                <span className="text-sm font-bold text-primary">{stats.activeProjects}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-300">Total Pemasukan</span>
                </div>
                <span className="text-sm font-bold text-emerald-500">{formatCurrency(stats.totalIncome)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded">
                <div className="flex items-center gap-3">
                  <WalletIcon className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-300">Hutang Belum Lunas</span>
                </div>
                <span className="text-sm font-bold text-yellow-500">{formatCurrency(stats.unpaidExpenses)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-surface-container-low rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-headline font-bold text-on-surface">
              Transaksi Terbaru
            </h3>
            <Link href="/transactions" className="text-xs text-primary hover:underline">
              Lihat Semua
            </Link>
          </div>
          <RecentTransactions transactions={stats.recentTransactions} />
        </div>

        {/* Active Projects */}
        <div className="bg-surface-container-low rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-headline font-bold text-on-surface">
              Proyek Aktif
            </h3>
            <Link href="/projects" className="text-xs text-primary hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="space-y-3">
            {stats.projects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between p-3 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{project.number}</span>
                  </div>
                  <div>
                    <p className="text-sm text-on-surface font-medium">{project.name}</p>
                    <p className="text-xs text-zinc-500">Budget: {formatCurrency(project.budget)}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </Link>
            ))}
            {stats.projects.length === 0 && (
              <p className="text-center text-zinc-500 py-4 text-sm">Belum ada proyek</p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-8 sm:mt-12 px-2 sm:px-4 py-6 sm:py-8 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 border border-primary/40 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full" />
          </div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">
            AXA Project - Sovereign Ledger
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
            Keamanan Terjamin
          </span>
          <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
            © 2026
          </span>
        </div>
      </footer>

      {/* FAB */}
      <Link
        href="/projects/new"
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 w-12 h-12 sm:w-14 sm:h-14 gold-gradient rounded-full shadow-[0_8px_32px_rgba(241,201,125,0.3)] flex items-center justify-center active:scale-90 transition-transform z-50 group"
      >
        <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-on-primary" />
        <span className="hidden lg:block absolute right-full mr-4 bg-surface-container-highest text-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Buat Proyek Baru
        </span>
      </Link>
    </div>
    </div>
  );
}
