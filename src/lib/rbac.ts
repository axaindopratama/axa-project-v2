import { createSupabaseClient } from "@/lib/supabase/client";

export type UserRole = "admin" | "manager" | "user";

export interface UserWithRole {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    "projects:create", "projects:read", "projects:update", "projects:delete",
    "tasks:create", "tasks:read", "tasks:update", "tasks:delete",
    "transactions:create", "transactions:read", "transactions:update", "transactions:delete",
    "entities:create", "entities:read", "entities:update", "entities:delete",
    "settings:read", "settings:update",
    "users:create", "users:read", "users:update", "users:delete",
    "audit:read",
    "backup:create", "backup:restore",
  ],
  manager: [
    "projects:create", "projects:read", "projects:update", "projects:delete",
    "tasks:create", "tasks:read", "tasks:update", "tasks:delete",
    "transactions:create", "transactions:read", "transactions:update", "transactions:delete",
    "entities:create", "entities:read", "entities:update", "entities:delete",
    "settings:read",
    "audit:read",
  ],
  user: [
    "projects:read",
    "tasks:create", "tasks:read", "tasks:update",
    "transactions:create", "transactions:read",
    "entities:read",
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export async function getCurrentUserWithRole(): Promise<UserWithRole | null> {
  const supabase = createSupabaseClient();
  
  try {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    if (!supabaseUser) {
      return null;
    }

    const userRole = (supabaseUser.user_metadata?.role as UserRole) || "user";
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || "User",
      role: userRole,
    };
  } catch {
    return null;
  }
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  // Allow all logged-in users to access settings
  if (pathname.startsWith('/settings')) {
    return true;
  }

  const adminRoutes = ["/users", "/audit"];
  const managerRoutes = ["/projects", "/projects/new", "/entities", "/entities/new", "/transactions", "/transactions/new", "/keuangan", "/kanban"];
  
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    return role === "admin";
  }
  
  if (managerRoutes.some(route => pathname.startsWith(route))) {
    return role === "admin" || role === "manager";
  }
  
  return true;
}
