import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { entities, transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    if (!hasPermission(auth.user.role, "entities:read")) {
      return NextResponse.json({ error: "Forbidden - No permission" }, { status: 403 });
    }

    const { id } = await params;
    const db = getDb();
    const result = await db.select().from(entities).where(eq(entities.id, id));
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: result[0] });
  } catch (error) {
    console.error("Error fetching entity:", error);
    return NextResponse.json({ error: "Failed to fetch entity" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    if (!hasPermission(auth.user.role, "entities:update")) {
      return NextResponse.json({ error: "Forbidden - No permission to update entity" }, { status: 403 });
    }

    const { id } = await params;
    const db = getDb();
    const body = await req.json();
    
    const updated = await db
      .update(entities)
      .set({
        name: body.name,
        type: body.type,
        contact: body.contact || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
      })
      .where(eq(entities.id, id))
      .returning();
    
    if (updated.length === 0) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: updated[0] });
  } catch (error) {
    console.error("Error updating entity:", error);
    return NextResponse.json({ error: "Failed to update entity" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    if (!hasPermission(auth.user.role, "entities:delete")) {
      return NextResponse.json({ error: "Forbidden - No permission to delete entity" }, { status: 403 });
    }

    const { id } = await params;
    const db = getDb();
    
    const deleted = await db
      .delete(entities)
      .where(eq(entities.id, id))
      .returning();
    
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: deleted[0] });
  } catch (error) {
    console.error("Error deleting entity:", error);
    return NextResponse.json({ error: "Failed to delete entity" }, { status: 500 });
  }
}