"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface BudgetAlert {
  projectId: string;
  projectName: string;
  percentage: number;
  type: "warning" | "critical";
  spent: number;
  budget: number;
  remaining: number;
}

interface BudgetAlertsPanelProps {
  alerts: BudgetAlert[];
}

export function BudgetAlertsPanel({ alerts }: BudgetAlertsPanelProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  
  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.projectId));
  
  if (visibleAlerts.length === 0) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-emerald-500" />
        <p className="text-sm text-emerald-400">Semua proyek dalam kondisi aman</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleAlerts.map((alert) => (
        <div 
          key={alert.projectId}
          className={`rounded-lg p-4 border ${
            alert.type === "critical" 
              ? "bg-red-500/10 border-red-500/30" 
              : "bg-yellow-500/10 border-yellow-500/30"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${
                alert.type === "critical" ? "text-red-500" : "text-yellow-500"
              }`}>
                {alert.type === "critical" ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-on-surface">{alert.projectName}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Rp {(alert.spent / 1000000).toFixed(1)}M / Rp {(alert.budget / 1000000).toFixed(1)}M terpakai
                </p>
                <div className="mt-2 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      alert.type === "critical" ? "bg-red-500" : "bg-yellow-500"
                    }`}
                    style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <button 
              onClick={() => setDismissed([...dismissed, alert.projectId])}
              className="text-zinc-500 hover:text-zinc-400"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${
              alert.type === "critical" 
                ? "bg-red-500/20 text-red-500" 
                : "bg-yellow-500/20 text-yellow-500"
            }`}>
              {alert.percentage}% - {alert.type === "critical" ? "Kritis" : "Peringatan"}
            </span>
            <Link 
              href={`/projects/${alert.projectId}`}
              className="text-xs text-primary hover:underline"
            >
              Lihat Proyek →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}