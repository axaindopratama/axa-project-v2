"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, User, LogOut, Settings, Loader2, Menu } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface TopAppBarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onMenuClick?: () => void;
}

export function TopAppBar({ user: initialUser, onMenuClick }: TopAppBarProps) {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(initialUser || null);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const fetchUser = useCallback(async () => {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        setUser({
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
          email: supabaseUser.email || '',
          avatar: supabaseUser.user_metadata?.avatar_url
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }, [supabase]);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchNotifications();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [fetchNotifications, fetchUser]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Search di projects page
      router.push(`/projects?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="flex justify-between items-center w-full px-4 md:px-6 h-16 bg-surface fixed top-0 left-0 lg:left-64 right-0 z-40 border-b border-outline-variant/20">
      {/* Search */}
      <div className="flex items-center gap-2 md:gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-surface-container-high transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => router.push('/projects')}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-surface-container-high transition-colors"
          aria-label="Buka pencarian proyek"
        >
          <Search className="w-5 h-5" />
        </button>

      <form onSubmit={handleSearch} className="hidden md:flex items-center gap-6 flex-1 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
          <input
            type="text"
            placeholder="Cari proyek, transaksi, vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-surface-container-low border-none text-zinc-300 text-sm py-2 pl-10 pr-4 w-full rounded-lg focus:ring-1 focus:ring-primary/40 placeholder:text-zinc-600"
          />
        </div>
      </form>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-zinc-500 hover:bg-surface-container-high transition-colors p-2 rounded-full"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-[min(20rem,calc(100vw-2rem))] bg-surface-container-low rounded-xl shadow-xl border border-zinc-800 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <h3 className="font-headline font-bold text-on-surface">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="p-4 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-zinc-500 text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 border-b border-zinc-800 hover:bg-surface-container-high cursor-pointer ${!notif.isRead ? 'bg-primary/5' : ''}`}
                    >
                      <p className="text-sm font-medium text-on-surface">{notif.title}</p>
                      <p className="text-xs text-zinc-500 mt-1">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-3 border-t border-zinc-800">
                <button 
                  onClick={() => {
                    setShowNotifications(false);
                    router.push('/settings');
                  }}
                  className="w-full text-center text-sm text-primary hover:text-primary/80"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:block h-6 w-px bg-outline-variant/20" />

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 cursor-pointer hover:bg-surface-container-high transition-colors p-1 pr-3 rounded-full"
          >
            {user?.avatar ? (
              <div className="w-8 h-8 rounded-full border border-primary/20 bg-surface-container-highest flex items-center justify-center">
                <span className="text-xs text-zinc-400">{getInitials(user.name)}</span>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant/30">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
            )}
            <span className="text-xs font-bold text-primary uppercase tracking-wider hidden md:inline">
              {user?.name ? getInitials(user.name) : "Guest"}
            </span>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-48 bg-surface-container-low rounded-xl shadow-xl border border-zinc-800 overflow-hidden">
              <div className="p-3 border-b border-zinc-800">
                <p className="text-sm font-medium text-on-surface">{user?.name || "Guest"}</p>
                <p className="text-xs text-zinc-500">{user?.email || "guest@example.com"}</p>
              </div>
              
              <div className="py-1">
                <button 
                  onClick={() => {
                    setShowProfile(false);
                    router.push('/settings');
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-surface-container-high flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push('/login');
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-surface-container-high flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}