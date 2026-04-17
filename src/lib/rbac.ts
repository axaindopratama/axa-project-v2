export type UserRole = "admin" | "manager" | "user";

type SupabaseLikeUser = {
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

export function normalizeUserRole(role: unknown): UserRole {
  if (typeof role !== "string") return "user";

  const normalized = role.toLowerCase().trim();

  if (normalized === "admin" || normalized === "administrator") return "admin";
  if (normalized === "manager") return "manager";

  return "user";
}

export function getSupabaseRoleValue(user: SupabaseLikeUser | null | undefined): unknown {
  return user?.app_metadata?.role ?? user?.user_metadata?.role;
}

export function resolveSupabaseUserRole(user: SupabaseLikeUser | null | undefined): UserRole {
  return normalizeUserRole(getSupabaseRoleValue(user));
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
  ],
  user: [
    "projects:read",
    "tasks:create", "tasks:read", "tasks:update",
    "transactions:create", "transactions:read",
    "entities:read",
  ],
};

export const ROUTE_PERMISSIONS: Array<{ path: string; permission?: string }> = [
  { path: "/", permission: undefined },
  { path: "/help", permission: undefined },
  { path: "/settings", permission: "settings:read" },
  { path: "/projects", permission: "projects:read" },
  { path: "/entities", permission: "entities:read" },
  { path: "/transactions", permission: "transactions:read" },
  { path: "/keuangan", permission: "transactions:read" },
  { path: "/kanban", permission: "tasks:read" },
  { path: "/scanner", permission: "tasks:read" },
  { path: "/ai-chat", permission: undefined },
  { path: "/admin/audit", permission: "audit:read" },
  { path: "/admin/users", permission: "users:read" },
];

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canPerformAction(role: UserRole, action: "create" | "read" | "update" | "delete", resource: string): boolean {
  const permission = `${resource}:${action}`;
  return hasPermission(role, permission);
}

export function canAccessResource(role: UserRole, resource: string): boolean {
  return hasPermission(role, `${resource}:read`) || 
         hasPermission(role, `${resource}:create`) ||
         hasPermission(role, `${resource}:update`) ||
         hasPermission(role, `${resource}:delete`);
}

export const resourceToPermission: Record<string, string> = {
  "/api/projects": "projects",
  "/api/tasks": "tasks",
  "/api/transactions": "transactions",
  "/api/entities": "entities",
  "/api/settings": "settings",
  "/api/users": "users",
  "/api/backup": "backup",
  "/api/admin": "admin",
};

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const matchRoute = (route: string) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  };

  const matchedPolicy = ROUTE_PERMISSIONS.find(({ path }) => matchRoute(path));
  if (matchedPolicy) {
    if (!matchedPolicy.permission) return true;
    return hasPermission(role, matchedPolicy.permission);
  }

  // Fallback aman untuk route protected yang belum terdaftar.
  return role === "admin";
}
