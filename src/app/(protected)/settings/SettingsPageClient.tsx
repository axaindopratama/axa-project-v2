"use client";

import { useState, useEffect } from "react";
import { useRouter } from \"next/navigation\";
import { Database, Bell, Shield, DollarSign, Clock, AlertTriangle, Users, Building, Download, Upload, FileText, Save, Camera, EyeOff, CircleCheck, CircleX, Loader2 } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";

const supabase = createSupabaseClient();

interface ToastMessage {
  type: "success" | "error";
  message: string;
}

interface CompanyData {
  id?: string;
  companyName?: string;
  companySubtitle?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyNpwp?: string;
  logo?: string;
}


interface UserData {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface SettingsPageClientProps {
  stats: {
    projects: number;
    transactions: number;
    entities: number;
    users: number;
    auditLogs: number;
    totalBudget: number;
    totalSpent: number;
    totalIncome: number;
    uptime: string;
    companyData: Record<string, string> | null;
    lastSync: string;
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export default function SettingsPageClient({ stats }: SettingsPageClientProps) {
  const router = useRouter();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [companyData, setCompanyData] = useState<CompanyData>({
    id: stats.companyData?.id || "",
    companyName: String(stats.companyData?.companyName || ""),
    companySubtitle: String(stats.companyData?.companySubtitle || ""),
    companyAddress: String(stats.companyData?.companyAddress || ""),
    companyPhone: String(stats.companyData?.companyPhone || ""),
    companyEmail: String(stats.companyData?.companyEmail || ""),
    companyNpwp: String(stats.companyData?.companyNpwp || ""),
    logo: String(stats.companyData?.logo || ""),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSavingCompany(true);
    try {
      // 1. Delete old logo if it exists
      if (companyData.logo) {
        const oldPath = companyData.logo.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('logo').remove([oldPath]);
        }
      }

      // 2. Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyData.id || 'new'}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logo')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 3. Get new URL
      const { data: { publicUrl } } = supabase.storage
        .from('logo')
        .getPublicUrl(fileName);

      const updatedData = { ...companyData, logo: publicUrl };
      setCompanyData(updatedData);

      // 4. Auto-save to database
      const res = await fetch("/api/settings?type=company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (res.ok && !data.error) {
        showToast("success", "Logo berhasil diunggah dan disimpan!");
        router.refresh();
      } else {
        showToast("error", data.error || "Logo terunggah tapi gagal disimpan");
      }
    } catch (error: any) {
      showToast("error", "Gagal mengunggah logo: " + error.message);
    } finally {
      setSavingCompany(false);
    }
  };


  const [userData, setUserData] = useState<UserData>({
    name: "",
    email: "",
    phone: "",
    role: "user"
  });

  const [newPassword, setNewPassword] = useState("");
  const [isSetupMode, setIsSetupMode] = useState(false);

  useEffect(() => {
    // Check for setup mode
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("setup") === "true") {
        setIsSetupMode(true);
      }
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/settings?type=profile");
        if (res.ok) {
          const { data } = await res.json();
          if (data) {
            setUserData({
              id: data.id,
              name: data.name || "",
              email: data.email || "",
              phone: data.phone || "",
              role: data.role || "user"
            });
            setCurrentUserId(data.id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoadingUser(false);
      }
    };
    
    fetchProfile();
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveCompany = async () => {
    if (!companyData.companyName?.trim()) {
      showToast("error", "Nama perusahaan wajib diisi!");
      return;
    }
    
    setSavingCompany(true);
    try {
      const res = await fetch("/api/settings?type=company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
      });

      const data = await res.json();
      
      if (res.ok && !data.error) {
        showToast("success", "Data perusahaan berhasil disimpan!");
      } else {
        showToast("error", data.error || "Gagal menyimpan data perusahaan");
      }
    } catch (error) {
      showToast("error", "Terjadi kesalahan saat menyimpan");
    } finally {
      setSavingCompany(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userData.name?.trim()) {
      showToast("error", "Nama wajib diisi!");
      return;
    }
    // We don't strictly require email here because we get it from auth
    
    setSavingProfile(true);
    try {
      const endpoint = currentUserId ? "/api/settings?type=user" : "/api/users/sync";
      const method = currentUserId ? "PUT" : "POST";
      
      const res = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentUserId,
          ...userData,
        }),
      });

      const data = await res.json();
      
      if (res.ok && !data.error) {
        showToast("success", "Profil berhasil diperbarui!");
        if (isSetupMode) {
          window.location.href = "/";
        }
      } else {
        showToast("error", data.error || "Gagal menyimpan profil");
      }
    } catch (error) {
      showToast("error", "Terjadi kesalahan saat menyimpan");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleExport = async (type: string) => {
    try {
      const res = await fetch(`/api/export?type=${type}`);
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showToast("success", `Data ${type} berhasil diekspor!`);
    } catch (error) {
      showToast("error", "Gagal mengekspor data");
    }
  };

  const handleBackup = async () => {
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Backup failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `axa-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showToast("success", "Backup berhasil diunduh!");
    } catch (error) {
      showToast("error", "Gagal membuat backup");
    }
  };

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

      {isSetupMode && (
        <div className="bg-primary/20 border border-primary text-on-surface p-4 rounded-xl flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-lg">Lengkapi Profil Anda</h3>
            <p className="text-zinc-300">Harap lengkapi nama dan email Anda untuk melanjutkan penggunaan aplikasi.</p>
          </div>
        </div>
      )}

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
                      value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Email</label>
                    <input 
                      type="email" 
                      value={userData.email}
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
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
                    value={userData.phone}
                    onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Peran</label>
                  <div className="px-3 py-2 bg-surface-container-highest rounded-lg text-zinc-400">{userData.role}</div>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 block mb-1">Kata Sandi Baru</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan kata sandi baru..."
                    className="w-full px-3 py-2 pr-10 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none"
                  />
                  <EyeOff className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button 
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
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
                <label className="text-xs text-zinc-500 block mb-1">Logo Perusahaan</label>
                <div className="flex items-center gap-4">
                  {companyData.logo && (
                    <img src={companyData.logo} alt="Logo" className="w-16 h-16 object-contain rounded border border-zinc-700" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary/90"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 block mb-1">Nama Perusahaan</label>
                <input 
                  type="text" 
                  value={companyData.companyName}
                  onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                  placeholder="PT Contoh Indonesia"
                  className="w-full px-3 py-2 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 block mb-1">Subtitle Perusahaan (CV. AXA INDO PRATAMA)</label>
                <input 
                  type="text" 
                  value={companyData.companySubtitle}
                  onChange={(e) => setCompanyData({ ...companyData, companySubtitle: e.target.value })}
                  placeholder="CV. AXA INDO PRATAMA"
                  className="w-full px-3 py-2 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">NPWP</label>
                  <input 
                    type="text" 
                    value={companyData.companyNpwp}
                    onChange={(e) => setCompanyData({ ...companyData, companyNpwp: e.target.value })}
                    placeholder="01.234.567.8-901.000"
                    className="w-full px-3 py-2 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Email Perusahaan</label>
                  <input 
                    type="email" 
                    value={companyData.companyEmail}
                    onChange={(e) => setCompanyData({ ...companyData, companyEmail: e.target.value })}
                    placeholder="info@perusahaan.com"
                    className="w-full px-3 py-2 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 block mb-1">Alamat</label>
                <textarea 
                  value={companyData.companyAddress}
                  onChange={(e) => setCompanyData({ ...companyData, companyAddress: e.target.value })}
                  placeholder="Jl. Contoh No. 123, Jakarta Selatan..."
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 block mb-1">Nomor Telepon</label>
                <input 
                  type="tel" 
                  value={companyData.companyPhone}
                  onChange={(e) => setCompanyData({ ...companyData, companyPhone: e.target.value })}
                  placeholder="+62 21 1234 5678"
                  className="w-full px-3 py-2 bg-surface-container-highest rounded-lg text-on-surface border border-transparent focus:border-primary outline-none"
                />
              </div>

              <button 
                onClick={handleSaveCompany}
                disabled={savingCompany}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingCompany ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingCompany ? "Menyimpan..." : "Simpan Data Perusahaan"}
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
              <button onClick={() => handleExport("projects")} className="flex flex-col items-center gap-2 p-4 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors">
                <FileText className="w-6 h-6 text-zinc-400" />
                <span className="text-xs text-zinc-400">Proyek</span>
              </button>
              <button onClick={() => handleExport("transactions")} className="flex flex-col items-center gap-2 p-4 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors">
                <FileText className="w-6 h-6 text-zinc-400" />
                <span className="text-xs text-zinc-400">Transaksi</span>
              </button>
              <button onClick={() => handleExport("entities")} className="flex flex-col items-center gap-2 p-4 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors">
                <FileText className="w-6 h-6 text-zinc-400" />
                <span className="text-xs text-zinc-400">Entitas</span>
              </button>
              <button onClick={() => handleExport("tasks")} className="flex flex-col items-center gap-2 p-4 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors">
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
                <button onClick={handleBackup} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg hover:bg-primary hover:text-on-primary transition-colors">
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

      {toast && (
        <div className="fixed bottom-6 right-6 p-4 rounded-xl shadow-xl flex items-center gap-3 z-50 bg-surface-container-low border border-zinc-700">
          {toast.type === "success" ? (
            <CircleCheck className="w-6 h-6 text-emerald-500" />
          ) : (
            <CircleX className="w-6 h-6 text-red-500" />
          )}
          <span className="text-zinc-300">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
