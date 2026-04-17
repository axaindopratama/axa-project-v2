import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAccessDenied } from "@/lib/audit";
import { getOrProvisionAppUser } from "@/lib/userProvisioning";
import { resolveSupabaseUserRole } from "@/lib/rbac";

export type UserRole = "admin" | "manager" | "user";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  user: AuthUser | null;
  error?: string;
}

export async function getAuthenticatedUser(_request: Request): Promise<AuthResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { user: null, error: "Unauthorized" };
    }

    let appUser;
    try {
      appUser = await getOrProvisionAppUser(user);
    } catch (error) {
      await logAccessDenied({
        userId: user.id,
        path: "api_auth_guard",
        method: _request.method,
        role: resolveSupabaseUserRole(user),
        reason: "user_provisioning_failed",
        metadata: {
          message: error instanceof Error ? error.message : "unknown_error",
        },
      });

      return { user: null, error: "User profile setup required" };
    }

    return {
      user: {
        id: user.id,
        email: user.email || "",
        name: appUser.name,
        role: appUser.role,
      },
    };
  } catch (error) {
    console.error("Auth error:", error);
    return { user: null, error: "Internal server error" };
  }
}

export function requireRole(requiredRole: UserRole): (user: AuthUser | null) => { authorized: boolean; error?: string } {
  return (user) => {
    if (!user) {
      return { authorized: false, error: "Unauthorized" };
    }

    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      manager: 2,
      admin: 3,
    };

    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      return { authorized: false, error: `Forbidden - ${requiredRole} role required` };
    }

    return { authorized: true };
  };
}