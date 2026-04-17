import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, companySettings, auditLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  if (!supabaseUser) return null;
  
  const db = getDb();
  const userRecord = await db
    .select()
    .from(users)
    .where(eq(users.supabaseUserId, supabaseUser.id))
    .limit(1);
  
  return userRecord[0] || null;
}

async function getAuthenticatedSupabaseUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !supabaseUser) return null;
  return supabaseUser;
}

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Nama wajib diisi"),
    phone: z.string().trim().optional().nullable(),
    avatar: z.string().trim().optional().nullable(),
  })
  .strict();

async function checkAdminRole() {
  const supabase = await createSupabaseServerClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  if (!supabaseUser) return false;

  const db = getDb();
  const userRecord = await db
    .select()
    .from(users)
    .where(eq(users.supabaseUserId, supabaseUser.id))
    .limit(1);

  return userRecord[0]?.role === 'admin';
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type === "company") {
      const result = await db.select().from(companySettings).limit(1);
      return NextResponse.json({ data: result[0] || null });
    }

    if (type === "audit-logs") {
      const limit = parseInt(searchParams.get("limit") || "50");
      const result = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
      return NextResponse.json({ data: result });
    }
    
    // Get current user's profile
    if (type === "profile") {
      const supabaseUser = await getAuthenticatedSupabaseUser();
      if (!supabaseUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const currentUser = await getCurrentUser();

      return NextResponse.json({
        data: {
          id: currentUser?.id ?? null,
          supabaseUserId: supabaseUser.id,
          name: currentUser?.name ?? "",
          email: currentUser?.email ?? supabaseUser.email ?? "",
          phone: currentUser?.phone ?? "",
          role: currentUser?.role ?? "user",
          avatar: currentUser?.avatar ?? null,
          isProvisioned: Boolean(currentUser),
        },
      });
    }

    const result = await db.select().from(users).orderBy(desc(users.createdAt));
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error fetching settings data:", error);
    return NextResponse.json({ error: "Gagal mengambil data pengaturan" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type === "company" && !(await checkAdminRole())) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    if (type === "user") {
      const supabaseUser = await getAuthenticatedSupabaseUser();
      if (!supabaseUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const parsed = updateProfileSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Payload profil tidak valid", details: parsed.error.issues },
          { status: 400 }
        );
      }

      const { name, phone, avatar } = parsed.data;
      const normalizedPhone = phone === null ? null : (phone?.trim() || null);
      const normalizedAvatar = avatar === null ? null : (avatar?.trim() || null);
      const normalizedEmail = supabaseUser.email ?? "";

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.supabaseUserId, supabaseUser.id))
        .limit(1);

      let result;
      if (existing.length > 0) {
        result = await db
          .update(users)
          .set({
            name,
            email: normalizedEmail,
            phone: normalizedPhone,
            avatar: normalizedAvatar,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(users.id, existing[0].id))
          .returning();
      } else {
        result = await db
          .insert(users)
          .values({
            id: crypto.randomUUID(),
            supabaseUserId: supabaseUser.id,
            name,
            email: normalizedEmail,
            phone: normalizedPhone,
            avatar: normalizedAvatar,
            role: "user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returning();
      }

      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        userId: supabaseUser.id,
        action: "PROFILE_UPDATE",
        tableName: "users",
        recordId: result[0].id,
        newValue: JSON.stringify({
          name,
          email: normalizedEmail,
          phone: normalizedPhone,
          avatar: normalizedAvatar,
        }),
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({ data: result[0] });
    }

    if (type === "company") {
      const { id, companyName, companySubtitle, companyAddress, companyPhone, companyEmail, companyNpwp, logo } = body;
      
      if (!companyName || !companyName.trim()) {
        return NextResponse.json({ error: "Nama perusahaan wajib diisi" }, { status: 400 });
      }

      const normalizedCompanyName = companyName.trim();
      const normalizedCompanySubtitle = typeof companySubtitle === "string" ? companySubtitle.trim() : companySubtitle;
      const normalizedCompanyAddress = typeof companyAddress === "string" ? companyAddress.trim() : companyAddress;
      const normalizedCompanyPhone = typeof companyPhone === "string" ? companyPhone.trim() : companyPhone;
      const normalizedCompanyEmail = typeof companyEmail === "string" ? companyEmail.trim() : companyEmail;
      const normalizedCompanyNpwp = typeof companyNpwp === "string" ? companyNpwp.trim() : companyNpwp;
      const normalizedLogo = typeof logo === "string" ? (logo.trim() || null) : null;

      const existing = await db.select().from(companySettings).limit(1);

      let result;
      if (existing.length > 0) {
        result = await db
          .update(companySettings)
          .set({
            companyName: normalizedCompanyName,
            companySubtitle: normalizedCompanySubtitle,
            companyAddress: normalizedCompanyAddress,
            companyPhone: normalizedCompanyPhone,
            companyEmail: normalizedCompanyEmail,
            companyNpwp: normalizedCompanyNpwp,
            logo: normalizedLogo,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(companySettings.id, existing[0].id))
          .returning();
      } else {
        result = await db
          .insert(companySettings)
          .values({
            id: id || crypto.randomUUID(),
            companyName: normalizedCompanyName,
            companySubtitle: normalizedCompanySubtitle,
            companyAddress: normalizedCompanyAddress,
            companyPhone: normalizedCompanyPhone,
            companyEmail: normalizedCompanyEmail,
            companyNpwp: normalizedCompanyNpwp,
            logo: normalizedLogo,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returning();
      }

      return NextResponse.json({ data: result[0] });
    }

    return NextResponse.json({ error: "Tipe tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Gagal memperbarui pengaturan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type === "create-user") {
      if (!(await checkAdminRole())) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
      }

      const { supabaseUserId, name, email, phone } = body;
      
      if (!supabaseUserId || !name || !email) {
        return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
      }

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.supabaseUserId, supabaseUserId))
        .limit(1);

      if (existingUser.length > 0) {
        return NextResponse.json({ error: "Pengguna sudah ada" }, { status: 400 });
      }

      const result = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          supabaseUserId,
          name,
          email,
          role: "user",
          phone,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        userId: result[0].id,
        action: "create",
        tableName: "users",
        recordId: result[0].id,
        newValue: JSON.stringify({ name, email, role: "user" }),
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({ data: result[0] });
    }

    return NextResponse.json({ error: "Tipe tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("Error creating settings data:", error);
    return NextResponse.json({ error: "Gagal membuat data" }, { status: 500 });
  }
}
