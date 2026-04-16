import { createSupabaseServerClient } from "@/lib/supabase/server";

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

export async function getAuthenticatedUser(request: Request): Promise<AuthResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { user: null, error: "Unauthorized" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { user: null, error: "Profile not found" };
    }

    const userRole = (profile.role as UserRole) || "user";

    return {
      user: {
        id: user.id,
        email: user.email || "",
        name: profile.name || user.email?.split("@")[0] || "User",
        role: userRole,
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