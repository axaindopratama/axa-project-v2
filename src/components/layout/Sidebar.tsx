"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen,
  CreditCard,
  Kanban,
  Scan,
  Handshake,
  Settings,
  HelpCircle,
  Plus,
  Wallet,
  Bot,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Proyek", href: "/projects", icon: FolderOpen },
  { name: "Entitas", href: "/entities", icon: Handshake },
  { name: "Transaksi", href: "/transactions", icon: CreditCard },
  { name: "Keuangan", href: "/keuangan", icon: Wallet },
  { name: "Kanban", href: "/kanban", icon: Kanban },
  { name: "AI Scanner", href: "/scanner", icon: Scan },
  { name: "AI Pilot", href: "/ai-chat", icon: Bot },
  { name: "Pengaturan", href: "/settings", icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col w-64 h-screen fixed left-0 top-0 py-8 bg-surface-container-low z-50",
        className
      )}
    >
      {/* Logo */}
      <div className="px-8 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 gold-gradient flex items-center justify-center rounded">
            <Wallet className="w-5 h-5 text-on-primary" />
          </div>
          <div>
            <h2 className="text-primary font-black font-headline tracking-tight uppercase leading-none">
              The Sovereign
            </h2>
            <p className="text-[10px] text-zinc-500 font-medium tracking-widest mt-1">
              Ledger v2.0
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-8 py-3 text-sm font-medium uppercase tracking-widest transition-all",
                isActive
                  ? "text-primary border-r-2 border-primary bg-surface-container-high"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-surface-container-highest"
              )}
            >
              <item.icon className="w-5 h-5 mr-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-8 mt-auto space-y-4">
        <Link href="/projects/new" className="w-full gold-gradient text-on-primary py-3 rounded-md font-headline font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/10 transition-transform active:scale-95 flex items-center justify-center">
          <Plus className="w-4 h-4 inline mr-2" />
          New Project
        </Link>
        <Link
          href="/help"
          className="flex items-center text-zinc-500 hover:text-zinc-300 text-sm font-medium uppercase tracking-widest py-2 transition-all"
        >
          <HelpCircle className="w-4 h-4 mr-4" />
          Bantuan
        </Link>
      </div>
    </aside>
  );
}