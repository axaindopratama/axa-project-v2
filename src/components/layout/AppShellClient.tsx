"use client";

import { useCallback, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopAppBar } from "@/components/layout/TopAppBar";

type UserRole = "admin" | "manager" | "user";

interface AppShellClientProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: UserRole | null;
  };
  company?: {
    logo?: string | null;
    name: string;
    subtitle: string;
  };
}

export function AppShellClient({ children, user, company }: AppShellClientProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setIsMobileNavOpen(false), []);
  const toggleMobileNav = useCallback(() => {
    setIsMobileNavOpen((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        user={user}
        company={company}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={closeMobileNav}
      />

      <div className="lg:ml-64">
        <TopAppBar user={user} onMenuClick={toggleMobileNav} />
        <main className="pt-16">{children}</main>
      </div>
    </div>
  );
}
