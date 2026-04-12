"use client";

import { useState } from "react";
import { Wallet, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Implement login with Supabase
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 gold-gradient rounded-2xl mb-6">
            <Wallet className="w-8 h-8 text-on-primary" />
          </div>
          <h1 className="text-3xl font-headline font-black text-primary uppercase tracking-tight">
            The Sovereign
          </h1>
          <p className="text-zinc-500 font-medium tracking-widest mt-2">
            Ledger v2.0
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/10">
          <h2 className="text-xl font-headline font-bold text-on-surface text-center mb-8">
            Masuk ke Akun
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
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
                  placeholder="admin@axa.com"
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-3 pl-12 pr-4 rounded-lg focus:ring-2 focus:ring-primary/40 placeholder:text-zinc-600"
                  required
                />
              </div>
            </div>

            {/* Password */}
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

            {/* Submit Button */}
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
          </form>

          {/* Footer */}
          <p className="text-center text-zinc-500 text-sm mt-8">
            Tidak punya akun?{" "}
            <a href="#" className="text-primary hover:underline">
              Hubungi Administrator
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-600 text-xs mt-8">
          AXA Project © 2024. All rights reserved.
        </p>
      </div>
    </div>
  );
}