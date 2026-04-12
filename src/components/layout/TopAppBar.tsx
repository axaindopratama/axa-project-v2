"use client";

import { useState } from "react";
import { Search, Bell, Wallet, User } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface TopAppBarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function TopAppBar({ user }: TopAppBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="flex justify-between items-center w-full px-10 h-16 bg-surface fixed top-0 right-0 left-64 z-40">
      {/* Search */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-lg" />
          <input
            type="text"
            placeholder="Cari data finansial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-surface-container-low border-none text-zinc-300 text-xs py-2 pl-10 pr-4 w-64 rounded focus:ring-1 focus:ring-primary/40 placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6">
        <div className="flex gap-4 items-center">
          <button className="text-zinc-500 hover:bg-surface-container-high transition-colors p-2 rounded-full">
            <Bell className="w-5 h-5" />
          </button>
          <button className="text-zinc-500 hover:bg-surface-container-high transition-colors p-2 rounded-full">
            <Wallet className="w-5 h-5" />
          </button>
        </div>

        <div className="h-8 w-px bg-outline-variant/20" />

        {/* User Profile */}
        <div className="flex items-center gap-3 cursor-pointer hover:bg-surface-container-high transition-colors p-1 pr-3 rounded-full">
          {user?.avatar ? (
            <div className="w-8 h-8 rounded-full border border-primary/20 bg-surface-container-highest flex items-center justify-center">
              <span className="text-xs text-zinc-400">{getInitials(user.name)}</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant/30">
              <User className="w-4 h-4 text-zinc-400" />
            </div>
          )}
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            {user?.name ? getInitials(user.name) : "Guest"}
          </span>
        </div>
      </div>
    </header>
  );
}