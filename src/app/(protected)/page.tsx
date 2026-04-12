import Link from "next/link";
import { Plus, TrendingUp, ChevronRight, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Mock data for demonstration
const mockProjects = [
  {
    id: "001",
    name: "Azure Heights",
    budget: 1000000000,
    spent: 450000000,
    status: "in_progress",
  },
  {
    id: "002",
    name: "Golden Gate",
    budget: 1000000000,
    spent: 820000000,
    status: "warning",
  },
  {
    id: "003",
    name: "Platinum Park",
    budget: 2000000000,
    spent: 120000000,
    status: "planning",
  },
];

const mockStats = {
  totalBalance: 1500000000,
  profitChange: 12.4,
  activeProjects: 3,
};

export default function DashboardPage() {
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
                {formatCurrency(mockStats.totalBalance)}
              </h1>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="w-5 h-5" />
                <span className="text-xl font-headline font-bold">
                  +{mockStats.profitChange}%
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
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                    Estimated Runway
                  </p>
                  <p className="text-2xl font-headline font-bold text-on-surface">
                    42 Hari{" "}
                    <span className="text-zinc-600 font-normal text-sm">Sisa</span>
                  </p>
                </div>
              </div>
              <div className="p-4 bg-surface-container-high rounded border-l-2 border-primary/40">
                <p className="text-xs text-zinc-400 italic">
                  Budget operasional akan habis pada 12 September 2024 berdasarkan spending 7 hari terakhir.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-zinc-500">Daily Spending</span>
                  <span className="text-primary">
                    {formatCurrency(12500000)}
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
              <svg
                className="w-4 h-4 text-zinc-600 group-hover:text-primary transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded bg-white/5 hover:bg-white/10 transition-colors group">
              <span className="text-xs text-zinc-300 font-medium">
                Audit Proyek 002
              </span>
              <svg
                className="w-4 h-4 text-zinc-600 group-hover:text-primary transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
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
            Last updated: 2 mins ago
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-surface-container-low p-6 rounded-lg group hover:bg-surface-container-high transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="text-primary font-headline font-black text-xl mb-1">
                    {project.id}
                  </p>
                  <h4 className="text-on-surface text-lg font-headline font-extrabold tracking-tight">
                    {project.name}
                  </h4>
                </div>
                <span
                  className={`px-2 py-1 text-[9px] uppercase font-bold tracking-widest rounded ${
                    project.status === "in_progress"
                      ? "bg-primary/10 text-primary"
                      : project.status === "warning"
                      ? "bg-error/10 text-error"
                      : "bg-surface-container-highest text-zinc-400"
                  }`}
                >
                  {project.status === "warning" && (
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                  )}
                  {project.status === "in_progress"
                    ? "In Progress"
                    : project.status === "warning"
                    ? "Warning"
                    : "Planning"}
                </span>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-zinc-500">Budget Usage</span>
                    <span className="text-zinc-300">
                      {formatCurrency(project.spent)} /{" "}
                      {formatCurrency(project.budget)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        (project.spent / project.budget) * 100 > 80
                          ? "bg-error"
                          : (project.spent / project.budget) * 100 > 60
                          ? "bg-yellow-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${(project.spent / project.budget) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full bg-surface-container-highest border border-surface-container-low flex items-center justify-center text-[8px] font-bold text-zinc-500"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                    <div className="w-6 h-6 rounded-full bg-surface-container-highest border border-surface-container-low flex items-center justify-center text-[8px] font-bold text-zinc-500">
                      +4
                    </div>
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
          <a
            className="text-[10px] text-zinc-600 hover:text-primary transition-colors uppercase tracking-[0.2em]"
            href="#"
          >
            Security Audit
          </a>
          <a
            className="text-[10px] text-zinc-600 hover:text-primary transition-colors uppercase tracking-[0.2em]"
            href="#"
          >
            Privacy Protocols
          </a>
          <a
            className="text-[10px] text-zinc-600 hover:text-primary transition-colors uppercase tracking-[0.2em]"
            href="#"
          >
            © 2024 AXA Ledger
          </a>
        </div>
      </footer>

      {/* FAB */}
      <Link
        href="/projects/new"
        className="fixed bottom-8 right-8 w-14 h-14 gold-gradient rounded-full shadow-[0_8px_32px_rgba(241,201,125,0.3)] flex items-center justify-center active:scale-90 transition-transform z-50 group"
      >
        <Plus className="w-6 h-6 text-on-primary" />
        <span className="absolute right-full mr-4 bg-surface-container-highest text-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Buat Proyek Baru
        </span>
      </Link>
    </div>
  );
}