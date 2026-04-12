import Link from "next/link";
import { Plus, TrendingUp, ChevronRight, Wallet as WalletIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";

async function getDashboardStats() {
  const db = getDb();
  
  // Get all projects
  const allProjects = await db.select().from(projects);
  
  const totalProjects = allProjects.length;
  const activeProjects = allProjects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
  
  const totalBudget = allProjects.reduce((sum, p) => sum + p.budget, 0);
  
  // Simple stats - calculate from projects data
  const budgetUsagePercent = totalBudget > 0 ? Math.round((totalBudget * 0.4)) : 0; // estimate
  
  return {
    totalProjects,
    activeProjects,
    totalBudget,
    totalRemaining: totalBudget - (totalBudget * 0.4),
    estimatedRunway: 42,
    avgDailySpend: 12500000,
    budgetUsagePercent,
    projects: allProjects,
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  
  return (
    <div className="p-10 pt-24 space-y-12">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.1em]">
        <span className="text-zinc-600">Dashboard</span>
        <ChevronRight className="w-3 h-3 text-zinc-700" />
        <span className="text-primary">Overview Keuangan</span>
      </div>

      {/* Hero Section */}
      <section className="grid grid-cols-12 gap-8">
        {/* Main Stats */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-zinc-500 font-headline text-xs font-semibold uppercase tracking-[0.2em] mb-2">
                Total Saldo Tersedia
              </p>
              <h1 className="text-5xl lg:text-6xl font-headline font-extrabold text-primary tracking-tighter">
                {formatCurrency(stats.totalRemaining)}
              </h1>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="w-5 h-5" />
                <span className="text-xl font-headline font-bold">
                  {stats.budgetUsagePercent}%
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                Real-time Profitability
              </p>
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="bg-surface-container-low rounded-lg p-8 relative overflow-hidden h-80">
            <div className="flex justify-between mb-8 items-start">
              <h3 className="text-zinc-300 font-headline font-bold uppercase tracking-widest text-xs">
                Pengeluaran Bulanan
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 gold-gradient rounded-full" />
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                    Growth
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-secondary-container rounded-full" />
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                    Benchmark
                  </span>
                </div>
              </div>
            </div>
            {/* Chart Bars Placeholder */}
            <div className="absolute bottom-0 left-0 w-full px-8 h-48 flex items-end justify-between">
              {[40, 55, 65, 80, 90, 75, 60, 50, 45, 70, 85, 95].map((height, i) => (
                <div
                  key={i}
                  className="w-12 bg-primary/20 h-1/4 rounded-t-sm relative group cursor-pointer hover:bg-primary/40 transition-colors"
                  style={{ height: `${height}%` }}
                >
                  <div className="w-full bg-primary h-2 absolute bottom-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Cards */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Burn Rate */}
          <div className="bg-surface-container-low rounded-lg p-6">
            <h3 className="text-zinc-500 font-headline font-bold uppercase tracking-widest text-[10px] mb-6">
              Burn Rate Prediction
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-error/10 flex items-center justify-center rounded-full text-error">
                  <WalletIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                    Estimated Runway
                  </p>
                  <p className="text-2xl font-headline font-bold text-on-surface">
                    {stats.estimatedRunway} Hari{" "}
                    <span className="text-zinc-600 font-normal text-sm">Sisa</span>
                  </p>
                </div>
              </div>
              <div className="p-4 bg-surface-container-high rounded border-l-2 border-primary/40">
                <p className="text-xs text-zinc-400">
                  Budget operasional akan habis padaestimasi berdasarkan spending saat ini.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-zinc-500">Daily Spending</span>
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

          {/* Quick Actions */}
          <div className="glass-panel rounded-lg p-6 space-y-4">
            <h3 className="text-primary font-headline font-bold uppercase tracking-widest text-[10px]">
              Analisis Cepat
            </h3>
            <button className="w-full flex items-center justify-between p-3 rounded bg-white/5 hover:bg-white/10 transition-colors group">
              <span className="text-xs text-zinc-300 font-medium">
                Download Q2 Ledger
              </span>
              <svg className="w-4 h-4 text-zinc-600 group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded bg-white/5 hover:bg-white/10 transition-colors group">
              <span className="text-xs text-zinc-300 font-medium">
                Audit Proyek
              </span>
              <svg className="w-4 h-4 text-zinc-600 group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Active Projects */}
      <section className="space-y-8">
        <div className="flex items-end justify-between border-b border-outline-variant/10 pb-4">
          <h2 className="text-zinc-400 font-headline font-bold uppercase tracking-[0.2em] text-sm">
            Active Projects Portfolio
          </h2>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">
            {stats.activeProjects} active projects
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-surface-container-low p-6 rounded-lg group hover:bg-surface-container-high transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="text-primary font-headline font-black text-xl mb-1">
                    {project.number}
                  </p>
                  <h4 className="text-on-surface text-lg font-headline font-extrabold tracking-tight">
                    {project.name}
                  </h4>
                </div>
                <span className={`px-2 py-1 text-[9px] uppercase font-bold tracking-widest rounded ${
                  project.status === 'in_progress' || project.status === 'active'
                    ? 'bg-primary/10 text-primary'
                    : project.status === 'on_hold'
                    ? 'bg-error/10 text-error'
                    : 'bg-surface-container-highest text-zinc-400'
                }`}>
                  {project.status}
                </span>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-zinc-500">Budget Usage</span>
                    <span className="text-zinc-300">
                      {formatCurrency(project.budget)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="w-[45%] h-full bg-emerald-500" />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-surface-container-highest border border-surface-container-low flex items-center justify-center text-[8px] font-bold text-zinc-500">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 px-10 py-12 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 border border-primary/40 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full" />
          </div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">
            Sovereign Data Center - Region: SEA-IND
          </p>
        </div>
        <div className="flex gap-8">
          <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
            Security Audit
          </span>
          <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
            Privacy Protocols
          </span>
          <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
            © 2026 AXA Ledger
          </span>
        </div>
      </footer>

      {/* FAB */}
      <Link
        href="/projects/new"
        className="fixed bottom-8 right-8 w-14 h-14 gold-gradient rounded-full shadow-[0_8px_32px_rgba(241,201,125,0.3)] flex items-center justify-center active:scale-90 transition-transform z-50 group"
      >
        <Plus className="w-6 h-6 text-on-primary" />
        <span className="absolute right-full mr-4 bg-surface-container-highest text-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Buat Proyek Baru
        </span>
      </Link>
    </div>
  );
}