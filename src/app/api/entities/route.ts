import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { entities } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    if (!hasPermission(auth.user.role, "entities:read")) {
      return NextResponse.json({ error: "Forbidden - No permission" }, { status: 403 });
    }

    const db = getDb();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    
    if (type) {
      const result = await db
        .select()
        .from(entities)
        .where(eq(entities.type, type))
        .orderBy(desc(entities.createdAt));
      return NextResponse.json({ data: result });
    }
    
    const allEntities = await db
      .select()
      .from(entities)
      .orderBy(desc(entities.createdAt));
    return NextResponse.json({ data: allEntities });
  } catch (error) {
    console.error("Error fetching entities:", error);
    return NextResponse.json(
      { error: "Failed to fetch entities" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    if (!hasPermission(auth.user.role, "entities:create")) {
      return NextResponse.json({ error: "Forbidden - No permission to create entity" }, { status: 403 });
    }

    const db = getDb();
    const body = await req.json();
    
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: "name and type are required" },
        { status: 400 }
      );
    }
    
    const newEntity = {
      id: crypto.randomUUID(),
      name: body.name,
      type: body.type,
      contact: body.contact || null,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      createdAt: new Date().toISOString(),
    };
    
    const inserted = await db.insert(entities).values(newEntity).returning();
    
    revalidatePath("/entities");
    
    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating entity:", error);
    return NextResponse.json(
      { error: "Failed to create entity" },
      { status: 500 }
    );
  }
}