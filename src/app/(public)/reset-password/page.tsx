"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase/client";
import { AlertCircle, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [canResetPassword, setCanResetPassword] = useState(false);

  const passwordError = useMemo(() => {
    if (!newPassword) return "";
    if (newPassword.length < 8) return "Password minimal 8 karakter";
    return "";
  }, [newPassword]);

  useEffect(() => {
    let mounted = true;

    const initializeRecovery = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session) {
          setCanResetPassword(true);
        }
      } finally {
        if (mounted) setIsCheckingSession(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY") {
        setCanResetPassword(true);
        setIsCheckingSession(false);
        return;
      }

      if (event === "SIGNED_IN" && session) {
        setCanResetPassword(true);
        setIsCheckingSession(false);
      }
    });

    initializeRecovery();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!canResetPassword) {
      setError("Link reset tidak valid atau sudah kedaluwarsa. Silakan minta link baru.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      await supabase.auth.signOut();

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-low rounded-2xl p-8 border border-outline-variant/10">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-headline font-black text-primary uppercase tracking-tight">
            Reset Password
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Masukkan password baru untuk akun Anda.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <p className="text-sm text-emerald-500">
              Password berhasil diperbarui. Anda akan diarahkan ke halaman login.
            </p>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                Password Baru
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40 placeholder:text-zinc-600"
                required
              />
              {passwordError && <p className="text-xs text-zinc-500">{passwordError}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                Konfirmasi Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40 placeholder:text-zinc-600"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || isCheckingSession || !canResetPassword}
              className="w-full gold-gradient text-on-primary py-4 rounded-lg font-headline font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Menyimpan..."
                : isCheckingSession
                  ? "Memeriksa Link..."
                  : canResetPassword
                    ? "Simpan Password Baru"
                    : "Link Reset Tidak Valid"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
