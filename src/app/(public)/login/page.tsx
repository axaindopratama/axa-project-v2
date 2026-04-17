"use client";

import Image from "next/image";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("AXA PROJECT");
  const [companySubtitle, setCompanySubtitle] = useState("CV. AXA INDO PRATAMA");

  // Create Supabase client inside component for proper lifecycle
  const supabase = createSupabaseClient();

  useEffect(() => {
    let mounted = true;

    const fetchCompany = async () => {
      try {
        const res = await fetch("/api/public/company");
        if (!res.ok) return;

        const payload = await res.json();
        const data = payload?.data;
        if (!mounted || !data) return;

        setCompanyLogo(typeof data.logo === "string" && data.logo.trim() ? data.logo.trim() : null);
        setCompanyName(typeof data.companyName === "string" && data.companyName.trim() ? data.companyName.trim().toUpperCase() : "AXA PROJECT");
        setCompanySubtitle(typeof data.companySubtitle === "string" && data.companySubtitle.trim() ? data.companySubtitle.trim() : "CV. AXA INDO PRATAMA");
      } catch {
        // keep fallback branding when request fails
      }
    };

    fetchCompany();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const trimmedEmail = email.trim().toLowerCase();
      
      const { error: authError, data } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Check if email is verified
      if (!data.user?.email_confirmed_at) {
        setError("Email belum diverifikasi. Silakan cek inbox email Anda untuk verifikasi.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Refresh router to update middleware state
      router.refresh();

      // Handle redirect parameter if exists
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect') || '/';
      
      // Small delay to ensure cookies are set properly
      setTimeout(() => {
        router.push(redirectTo);
      }, 300);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat login");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError("");
    setResetSent(false);

    try {
      const trimmedEmail = resetEmail.trim().toLowerCase();
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setResetSent(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim link reset");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-48 h-36 bg-transparent rounded-2xl mb-0 overflow-hidden">
            {companyLogo ? (
              <Image
                src={companyLogo}
                alt={companyName}
                width={192}
                height={192}
                unoptimized
                className="w-full h-full object-contain rounded-2xl scale-125"
              />
            ) : (
              <Wallet className="w-8 h-8 text-on-primary" />
            )}
          </div>
          <h1 className="-mt-4 text-3xl font-headline font-black text-primary uppercase tracking-tight leading-none">
            {companyName}
          </h1>
          <p className="text-zinc-500 font-medium tracking-widest mt-0 leading-none">
            {companySubtitle}
          </p>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/10">
          <h2 className="text-xl font-headline font-bold text-on-surface text-center mb-8">
            Masuk ke Akun
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <form onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-6">
            {showForgotPassword ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="axaindopratama@gmail.com"
                      className="w-full bg-surface-container-high border-none text-zinc-300 py-3 pl-12 pr-4 rounded-lg focus:ring-2 focus:ring-primary/40 placeholder:text-zinc-600"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full gold-gradient text-on-primary py-4 rounded-lg font-headline font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {resetLoading ? (
                    <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      Kirim Link Reset
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setError("");
                  }}
                  className="w-full text-center text-sm text-zinc-500 hover:text-zinc-300"
                >
                  Kembali ke Login
                </button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="axaindopratama@gmail.com"
                      className="w-full bg-surface-container-high border-none text-zinc-300 py-3 pl-12 pr-4 rounded-lg focus:ring-2 focus:ring-primary/40 placeholder:text-zinc-600"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-surface-container-high border-none text-zinc-300 py-3 pl-12 pr-4 rounded-lg focus:ring-2 focus:ring-primary/40 placeholder:text-zinc-600"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full gold-gradient text-on-primary py-4 rounded-lg font-headline font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      Masuk
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}
          </form>

          {!showForgotPassword && (
            <div className="text-center mt-4">
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Lupa Password?
              </button>
            </div>
          )}

          {resetSent && (
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-500">
                Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.
              </p>
            </div>
          )}

          <p className="text-center text-zinc-500 text-sm mt-8">
            Tidak punya akun?{" "}
            <a href="https://wa.me/6281250070876" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Hubungi Administrator
            </a>
          </p>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-8">
          AXA Project © 2024. All rights reserved.
        </p>
      </div>
    </div>
  );
}