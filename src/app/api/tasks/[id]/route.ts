import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
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

    if (!hasPermission(auth.user.role, "tasks:read")) {
      return NextResponse.json({ error: "Forbidden - No permission" }, { status: 403 });
    }

    const { id } = await params;
    const db = getDb();
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: result[0] });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
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

    if (!hasPermission(auth.user.role, "tasks:update")) {
      return NextResponse.json({ error: "Forbidden - No permission to update task" }, { status: 403 });
    }

    const { id } = await params;
    const db = getDb();
    const body = await req.json();
    
    const updates: Record<string, unknown> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.title !== undefined) updates.title = body.title;
    if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo || null;
    if (body.estCost !== undefined) updates.estCost = parseInt(body.estCost) || body.estCost;
    if (body.actCost !== undefined) updates.actCost = parseInt(body.actCost) || body.actCost;
    if (body.hours !== undefined) updates.hours = parseFloat(body.hours) || body.hours;
    if (body.startedAt !== undefined) updates.startedAt = body.startedAt || null;
    if (body.completedAt !== undefined) updates.completedAt = body.completedAt || null;
    
    const updated = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    
    if (updated.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: updated[0] });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
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

    if (!hasPermission(auth.user.role, "tasks:delete")) {
      return NextResponse.json({ error: "Forbidden - No permission to delete task" }, { status: 403 });
    }

    const { id } = await params;
    const db = getDb();
    
    const deleted = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();
    
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: deleted[0] });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}