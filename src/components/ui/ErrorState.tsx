"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ErrorState({ 
  title = "Terjadi Kesalahan", 
  message, 
  action 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-headline font-bold text-on-surface mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-md mb-6">{message}</p>
      {action ? (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-6 py-3 bg-surface-container-high hover:bg-surface-container-highest text-zinc-300 rounded-lg font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {action.label}
        </button>
      ) : (
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-surface-container-high hover:bg-surface-container-highest text-zinc-300 rounded-lg font-medium transition-colors"
        >
          <Home className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>
      )}
    </div>
  );
}

export function ErrorCard({ message }: { message: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
      <p className="text-sm text-red-500">{message}</p>
    </div>
  );
}