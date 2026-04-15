import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, companySettings, auditLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  return userRecord[0]?.role === 'administrator';
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
      const { id, name, email, phone, avatar } = body;
      
      if (!name || !name.trim()) {
        return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
      }
      if (!email || !email.trim()) {
        return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
      }
      if (!id) {
        return NextResponse.json({ error: "ID pengguna diperlukan" }, { status: 400 });
      }

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      let result;
      if (existing.length > 0) {
        result = await db
          .update(users)
          .set({
            name,
            email,
            phone,
            avatar,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(users.id, id))
          .returning();
      } else {
        result = await db
          .insert(users)
          .values({
            id: crypto.randomUUID(),
            supabaseUserId: id,
            name,
            email,
            phone,
            avatar,
            role: "user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returning();
      }

      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        userId: id,
        action: "update",
        tableName: "users",
        recordId: id,
        newValue: JSON.stringify({ name, email, phone }),
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({ data: result[0] });
    }

    if (type === "company") {
      const { id, companyName, companySubtitle, companyAddress, companyPhone, companyEmail, companyNpwp, logo } = body;
      
      if (!companyName || !companyName.trim()) {
        return NextResponse.json({ error: "Nama perusahaan wajib diisi" }, { status: 400 });
      }

      const existing = await db.select().from(companySettings).limit(1);

      let result;
      if (existing.length > 0) {
        result = await db
          .update(companySettings)
          .set({
            companyName,
            companySubtitle,
            companyAddress,
            companyPhone,
            companyEmail,
            companyNpwp,
            logo,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(companySettings.id, existing[0].id))
          .returning();
      } else {
        result = await db
          .insert(companySettings)
          .values({
            id: id || crypto.randomUUID(),
            companyName,
            companySubtitle,
            companyAddress,
            companyPhone,
            companyEmail,
            companyNpwp,
            logo,
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
      const { supabaseUserId, name, email, role, phone } = body;
      
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
          role: role || "user",
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
        newValue: JSON.stringify({ name, email, role }),
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
