import { Settings, Database, Bell, Shield, Palette, DollarSign, Clock, AlertTriangle, Users, Building, Download, Upload, FileText, Save, Camera, Eye, EyeOff } from "lucide-react";
import { getDb } from "@/lib/db";
import { projects, transactions, entities, users, companySettings, auditLogs } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

async function getSystemStats() {
  const db = getDb();
  try {
    const allProjects = await db.select().from(projects);
    const allTransactions = await db.select().from(transactions);
    const allEntities = await db.select().from(entities);
    const allUsers = await db.select().from(users);
    const allAuditLogs = await db.select().from(auditLogs);
    const companyData = await db.select().from(companySettings).limit(1);

    const totalBudget = allProjects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = allTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = allTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);

    return {
      projects: allProjects.length,
      transactions: allTransactions.length,
      entities: allEntities.length,
      users: allUsers.length,
      auditLogs: allAuditLogs.length,
      totalBudget,
      totalSpent,
      totalIncome,
      uptime: "99.9%",
      companyData: companyData[0] || null,
      lastSync: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching system stats:", error);
    return {
      projects: 0,
      transactions: 0,
      entities: 0,
      users: 0,
      auditLogs: 0,
      totalBudget: 0,
      totalSpent: 0,
      totalIncome: 0,
      uptime: "99.9%",
      companyData: null,
      lastSync: new Date().toISOString(),
    };
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SettingsPage() {
  const stats = await getSystemStats();

  return (
    <div className="p-6 lg:p-10 pt-24 space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-on-surface">
          Pengaturan
        </h1>
        <p className="text-zinc-500 mt-1">
          Konfigurasi sistem, profil, dan preferensi
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profil Pengguna */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Profil Pengguna
                </h2>
                <p className="text-xs text-zinc-500">Kelola informasi akun Anda</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-surface-container-high rounded-lg">
                <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
                  <Camera className="w-6 h-6 text-zinc-500" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      defaultValue="Admin User"
                      className="w-full px-3 py-2 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Email</label>
                    <input 
                      type="email" 
                      defaultValue="admin@axaproject.com"
                      className="w-full px-3 py-2 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Nomor Telepon</label>
                  <input 
                    type="tel" 
                    defaultValue="+62 812 3456 7890"
                    className="w-full px-3 py-2 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Peran</label>
                  <div className="px-3 py-2 bg-surface-container-highest rounded-lg text-zinc-400">Administrator</div>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 block mb-1">Kata Sandi Baru</label>
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="Masukkan kata sandi baru..."
                    className="w-full px-3 py-2 pr-10 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none"
                  />
                  <EyeOff className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors">
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </button>
            </div>
          </div>

          {/* Data Perusahaan */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Data Perusahaan
                </h2>
                <p className="text-xs text-zinc-500">Informasi perusahaan untuk faktur dan laporan</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Nama Perusahaan</label>
                <input 
                  type="text" 
                  defaultValue={stats.companyData?.companyName || ""}
                  placeholder="PT Contoh Indonesia"
                  className="w-full px-3 py-2 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">NPWP</label>
                  <input 
                    type="text" 
                    defaultValue={stats.companyData?.companyNpwp || ""}
                    placeholder="01.234.567.8-901.000"
                    className="w-full px-3 py-2 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Email Perusahaan</label>
                  <input 
                    type="email" 
                    defaultValue={stats.companyData?.companyEmail || ""}
                    placeholder="info@perusahaan.com"
                    className="w-full px-3 py-2 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 block mb-1">Alamat</label>
                <textarea 
                  defaultValue={stats.companyData?.companyAddress || ""}
                  placeholder="Jl. Contoh No. 123, Jakarta Selatan..."
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 block mb-1">Nomor Telepon</label>
                <input 
                  type="tel" 
                  defaultValue={stats.companyData?.companyPhone || ""}
                  placeholder="+62 21 1234 5678"
                  className="w-full px-3 py-2 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none"
                />
              </div>

              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors">
                <Save className="w-4 h-4" />
                Simpan Data Perusahaan
              </button>
            </div>
          </div>

          {/* Pengaturan Proyek Default */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Pengaturan Proyek Default
                </h2>
                <p className="text-xs text-zinc-500">Konfigurasi default untuk proyek baru</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-surface-container-high rounded-lg">
                <div>
                  <p className="text-sm font-headline font-bold text-on-surface">Tarif Per Jam Default</p>
                  <p className="text-xs text-zinc-500">Tarif default untuk kalkulasi biaya tenaga kerja</p>
                </div>
                <span className="text-primary font-headline font-bold text-lg">
                  {formatCurrency(150000)}/jam
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-surface-container-high rounded-lg">
                <div>
                  <p className="text-sm font-headline font-bold text-on-surface">Mata Uang Default</p>
                  <p className="text-xs text-zinc-500">Mata uang untuk semua proyek</p>
                </div>
                <span className="text-zinc-300 font-headline font-bold">IDR (Rupiah)</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-surface-container-high rounded-lg">
                <div>
                  <p className="text-sm font-headline font-bold text-on-surface">Penomoran Otomatis</p>
                  <p className="text-xs text-zinc-500">Format penomoran proyek otomatis</p>
                </div>
                <span className="text-zinc-300 font-headline font-bold">XXX (001, 002, ...)</span>
              </div>
            </div>
          </div>

          {/* Batas Peringatan Budget */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Batas Peringatan Budget
                </h2>
                <p className="text-xs text-zinc-500">Pengaturan batas peringatan budget</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container-high rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Peringatan</span>
                </div>
                <p className="text-2xl font-headline font-bold text-on-surface">60%</p>
                <p className="text-xs text-zinc-600">Akan ada peringatan kuning</p>
              </div>

              <div className="p-4 bg-surface-container-high rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Kritis</span>
                </div>
                <p className="text-2xl font-headline font-bold text-on-surface">80%</p>
                <p className="text-xs text-zinc-600">Akan ada peringatan merah</p>
              </div>
            </div>
          </div>

          {/* Ekspor Data */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Ekspor Data
                </h2>
                <p className="text-xs text-zinc-500">Unduh data dalam format CSV</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button className="flex flex-col items-center gap-2 p-4 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors">
                <FileText className="w-6 h-6 text-zinc-400" />
                <span className="text-xs text-zinc-400">Proyek</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors">
                <FileText className="w-6 h-6 text-zinc-400" />
                <span className="text-xs text-zinc-400">Transaksi</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors">
                <FileText className="w-6 h-6 text-zinc-400" />
                <span className="text-xs text-zinc-400">Entitas</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors">
                <FileText className="w-6 h-6 text-zinc-400" />
                <span className="text-xs text-zinc-400">Tugas</span>
              </button>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Cadangan & Pemulihan
                </h2>
                <p className="text-xs text-zinc-500">Backup dan restore database</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container-high rounded-lg">
                <h3 className="text-sm font-headline font-bold text-on-surface mb-2">Ekspor Database</h3>
                <p className="text-xs text-zinc-500 mb-3">Unduh salinan lengkap database</p>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg hover:bg-primary hover:text-on-primary transition-colors">
                  <Download className="w-4 h-4" />
                  Unduh Backup
                </button>
              </div>

              <div className="p-4 bg-surface-container-high rounded-lg">
                <h3 className="text-sm font-headline font-bold text-on-surface mb-2">Impor Database</h3>
                <p className="text-xs text-zinc-500 mb-3">Pulihkan dari file backup</p>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg hover:bg-primary hover:text-on-primary transition-colors">
                  <Upload className="w-4 h-4" />
                  Impor Backup
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Sistem */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                <Database className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Info Sistem
                </h2>
                <p className="text-xs text-zinc-500">Informasi database</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">Total Proyek</span>
                <span className="text-on-surface font-headline font-bold">{stats.projects}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">Total Transaksi</span>
                <span className="text-on-surface font-headline font-bold">{stats.transactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">Total Entitas</span>
                <span className="text-on-surface font-headline font-bold">{stats.entities}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">Total Pengguna</span>
                <span className="text-on-surface font-headline font-bold">{stats.users}</span>
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

          {/* Keamanan */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                <Shield className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Keamanan
                </h2>
                <p className="text-xs text-zinc-500">Pengaturan keamanan</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Autentikasi 2 Faktor</span>
                <span className="text-xs text-zinc-600 px-2 py-1 bg-surface-container-high rounded">Mati</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Batas Sesi</span>
                <span className="text-xs text-zinc-300">30 hari</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Aktivitas Terakhir</span>
                <span className="text-xs text-zinc-300">{new Date().toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* Notifikasi */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                <Bell className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Notifikasi
                </h2>
                <p className="text-xs text-zinc-500">Preferensi notifikasi</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Peringatan Budget</span>
                <div className="w-8 h-4 bg-primary rounded-full relative">
                  <div className="w-3 h-3 bg-on-primary rounded-full absolute right-0.5 top-0.5" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Pembaruan Tugas</span>
                <div className="w-8 h-4 bg-primary rounded-full relative">
                  <div className="w-3 h-3 bg-on-primary rounded-full absolute right-0.5 top-0.5" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Pengingat Pembayaran</span>
                <div className="w-8 h-4 bg-surface-container-highest rounded-full relative">
                  <div className="w-3 h-3 bg-zinc-500 rounded-full absolute left-0.5 top-0.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Riwayat Aktivitas */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                <FileText className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Riwayat Aktivitas
                </h2>
                <p className="text-xs text-zinc-500">Log aktivitas sistem ({stats.auditLogs} entri)</p>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              <div className="text-xs text-zinc-500 p-2 bg-surface-container-high rounded">
                <p className="text-zinc-400">Belum ada aktivitas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
