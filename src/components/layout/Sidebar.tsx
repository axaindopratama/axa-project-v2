"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createSupabaseClient } from "@/lib/supabase/client";
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
  Shield,
  LogOut,
  User as UserIcon,
} from "lucide-react";

type UserRole = "admin" | "manager" | "user";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["admin", "manager", "user"] },
  { name: "Proyek", href: "/projects", icon: FolderOpen, roles: ["admin", "manager", "user"] },
  { name: "Entitas", href: "/entities", icon: Handshake, roles: ["admin", "manager", "user"] },
  { name: "Transaksi", href: "/transactions", icon: CreditCard, roles: ["admin", "manager", "user"] },
  { name: "Keuangan", href: "/keuangan", icon: Wallet, roles: ["admin", "manager"] },
  { name: "Kanban", href: "/kanban", icon: Kanban, roles: ["admin", "manager"] },
  { name: "AI Scanner", href: "/scanner", icon: Scan, roles: ["admin", "manager"] },
  { name: "AI Pilot", href: "/ai-chat", icon: Bot, roles: ["admin", "manager", "user"] },
  { name: "Pengaturan", href: "/settings", icon: Settings, roles: ["admin", "manager", "user"] },
  { name: "Audit Log", href: "/admin/audit", icon: Shield, roles: ["admin"] },
];

export function Sidebar({ className, company, user }: { 
  className?: string, 
  company?: { logo?: string | null, name: string, subtitle: string },
  user?: { name: string; email: string; avatar?: string; role?: UserRole | null }
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseClient();

  const userRole = user?.role || "user";
  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole as UserRole)
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

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
          <div className="w-8 h-8 gold-gradient flex items-center justify-center rounded overflow-hidden">
            {company?.logo ? (
              <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
            ) : (
              <Wallet className="w-5 h-5 text-on-primary" />
            )}
          </div>
          <div>
            <h2 className="text-primary font-black font-headline tracking-tight uppercase leading-none">
              {company?.name || "AXA-PROJECT"}
            </h2>
            <p className="text-[10px] text-zinc-500 font-medium tracking-widest mt-1">
              {company?.subtitle || "CV. AXA INDO PRATAMA"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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
        {/* User Info */}
        <div className="flex items-center gap-3 p-3 bg-surface-container-highest rounded-lg mb-4">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-on-surface truncate">{user?.name || "User"}</p>
            <p className="text-[10px] text-zinc-500 truncate">{user?.email || ""}</p>
          </div>
          <button onClick={handleLogout} className="text-zinc-500 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

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