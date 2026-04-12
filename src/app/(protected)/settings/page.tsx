import { Settings as SettingsIcon, Database, Bell, Shield, Palette, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { getDb } from "@/lib/db";
import { projects, transactions, entities } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

async function getSystemStats() {
  const db = getDb();
  try {
    const allProjects = await db.select().from(projects);
    const allTransactions = await db.select().from(transactions);
    const allEntities = await db.select().from(entities);

    const totalBudget = allProjects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = allTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = allTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);

    return {
      projects: allProjects.length,
      transactions: allTransactions.length,
      entities: allEntities.length,
      totalBudget,
      totalSpent,
      totalIncome,
      uptime: "99.9%",
      lastSync: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching system stats:", error);
    return {
      projects: 0,
      transactions: 0,
      entities: 0,
      totalBudget: 0,
      totalSpent: 0,
      totalIncome: 0,
      uptime: "99.9%",
      lastSync: new Date().toISOString(),
    };
  }
}

export default async function SettingsPage() {
  const stats = await getSystemStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="p-10 pt-24 space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-on-surface">
          Pengaturan
        </h1>
        <p className="text-zinc-500 mt-1">
          Konfigurasi sistem dan preferensi
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Default Project Settings
                </h2>
                <p className="text-xs text-zinc-500">Konfigurasi default untuk proyek baru</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-surface-container-high rounded-lg">
                <div>
                  <p className="text-sm font-headline font-bold text-on-surface">Hourly Rate Default</p>
                  <p className="text-xs text-zinc-500">Rate default untuk kalkulasi biaya tenaga kerja</p>
                </div>
                <span className="text-primary font-headline font-bold text-lg">
                  {formatCurrency(150000)}/jam
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-surface-container-high rounded-lg">
                <div>
                  <p className="text-sm font-headline font-bold text-on-surface">Default Currency</p>
                  <p className="text-xs text-zinc-500">Mata uang untuk semua proyek</p>
                </div>
                <span className="text-zinc-300 font-headline font-bold">IDR (Rupiah)</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-surface-container-high rounded-lg">
                <div>
                  <p className="text-sm font-headline font-bold text-on-surface">Auto Numbering</p>
                  <p className="text-xs text-zinc-500">Format penomoran proyek otomatis</p>
                </div>
                <span className="text-zinc-300 font-headline font-bold">XXX (001, 002, ...)</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Budget Alert Thresholds
                </h2>
                <p className="text-xs text-zinc-500">Pengaturan batas peringatan budget</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container-high rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Warning</span>
                </div>
                <p className="text-2xl font-headline font-bold text-on-surface">60%</p>
                <p className="text-xs text-zinc-600">Akan ada peringatan kuning</p>
              </div>

              <div className="p-4 bg-surface-container-high rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Critical</span>
                </div>
                <p className="text-2xl font-headline font-bold text-on-surface">80%</p>
                <p className="text-xs text-zinc-600">Akan ada peringatan merah</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Payment Status
                </h2>
                <p className="text-xs text-zinc-500">Opsi status pembayaran</p>
              </div>
            </div>

            <div className="space-y-2">
              {["Lunas (Paid)", "Belum Lunas (Unpaid)", "Cicilan (Partial)"].map((status) => (
                <div key={status} className="flex items-center justify-between p-3 bg-surface-container-high rounded-lg">
                  <span className="text-sm text-zinc-300">{status}</span>
                  <div className="w-4 h-4 rounded border border-zinc-600 bg-surface-container-highest" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                <Database className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  System Info
                </h2>
                <p className="text-xs text-zinc-500">Informasi database</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">Total Projects</span>
                <span className="text-on-surface font-headline font-bold">{stats.projects}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">Total Transactions</span>
                <span className="text-on-surface font-headline font-bold">{stats.transactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">Total Entities</span>
                <span className="text-on-surface font-headline font-bold">{stats.entities}</span>
              </div>
              <div className="border-t border-surface-container-highest pt-4">
                <div className="flex justify-between">
                  <span className="text-zinc-500 text-sm">Database</span>
                  <span className="text-primary font-headline font-bold">Turso (LibSQL)</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">Uptime</span>
                <span className="text-emerald-500 font-headline font-bold">{stats.uptime}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                <Shield className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Security
                </h2>
                <p className="text-xs text-zinc-500">Pengaturan keamanan</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Two-Factor Auth</span>
                <span className="text-xs text-zinc-600 px-2 py-1 bg-surface-container-high rounded">Off</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Session Timeout</span>
                <span className="text-xs text-zinc-300">30 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Last Activity</span>
                <span className="text-xs text-zinc-300">{new Date().toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                <Bell className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Notifications
                </h2>
                <p className="text-xs text-zinc-500">Preferensi notifikasi</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Budget Alerts</span>
                <div className="w-8 h-4 bg-primary rounded-full relative">
                  <div className="w-3 h-3 bg-on-primary rounded-full absolute right-0.5 top-0.5" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Task Updates</span>
                <div className="w-8 h-4 bg-primary rounded-full relative">
                  <div className="w-3 h-3 bg-on-primary rounded-full absolute right-0.5 top-0.5" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Payment Reminders</span>
                <div className="w-8 h-4 bg-surface-container-highest rounded-full relative">
                  <div className="w-3 h-3 bg-zinc-500 rounded-full absolute left-0.5 top-0.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}