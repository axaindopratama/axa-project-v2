import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSupabaseRoleValue, normalizeUserRole, type UserRole } from "@/lib/rbac";
import { eq } from "drizzle-orm";

interface SupabaseAuthUserLite {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: {
    name?: string;
    full_name?: string;
    role?: string;
    avatar_url?: string;
    phone?: string;
  } | null;
}

export interface AppUserContext {
  id: string;
  supabaseUserId: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  companyId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  wasProvisioned: boolean;
}

export async function getOrProvisionAppUser(supabaseUser: SupabaseAuthUserLite): Promise<AppUserContext> {
  const db = getDb();
  const now = new Date().toISOString();

  const metadataRoleValue = getSupabaseRoleValue(supabaseUser);
  const hasMetadataRole = typeof metadataRoleValue === "string" && metadataRoleValue.trim().length > 0;
  const metadataRole = normalizeUserRole(metadataRoleValue);
  const roleForCreate: UserRole = hasMetadataRole ? metadataRole : "user";
  const fallbackName =
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.user_metadata?.name ||
    supabaseUser.email?.split("@")[0] ||
    "User";
  const fallbackEmail = supabaseUser.email || "";

  const existingUserRows = await db
    .select()
    .from(users)
    .where(eq(users.supabaseUserId, supabaseUser.id))
    .limit(1);

  const existingUser = existingUserRows[0];

  if (!existingUser) {
    const insertedId = crypto.randomUUID();
    await db.insert(users).values({
      id: insertedId,
      supabaseUserId: supabaseUser.id,
      name: fallbackName,
      email: fallbackEmail,
      role: roleForCreate,
      avatar: supabaseUser.user_metadata?.avatar_url || null,
      phone: supabaseUser.user_metadata?.phone || null,
      companyId: null,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: insertedId,
      supabaseUserId: supabaseUser.id,
      name: fallbackName,
      email: fallbackEmail,
      phone: supabaseUser.user_metadata?.phone || null,
      avatar: supabaseUser.user_metadata?.avatar_url || null,
      role: roleForCreate,
      companyId: null,
      createdAt: now,
      updatedAt: now,
      wasProvisioned: true,
    };
  }

  // Governance lock: untuk user existing, Turso users.role selalu authoritative.
  // Metadata Supabase hanya dipakai saat bootstrap create pertama.
  const normalizedExistingRole = normalizeUserRole(existingUser.role);
  const effectiveRole = normalizedExistingRole;

  return {
    id: existingUser.id,
    supabaseUserId: existingUser.supabaseUserId,
    name: existingUser.name || fallbackName,
    email: existingUser.email || fallbackEmail,
    phone: existingUser.phone || null,
    avatar: existingUser.avatar || null,
    role: effectiveRole,
    companyId: existingUser.companyId || null,
    createdAt: existingUser.createdAt || null,
    updatedAt: existingUser.updatedAt || null,
    wasProvisioned: false,
  };
}
