import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const { id } = await params;
    const db = getDb();
    const body = await req.json();
    
    const updates: any = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.title !== undefined) updates.title = body.title;
    if (body.estCost !== undefined) updates.estCost = body.estCost;
    if (body.actCost !== undefined) updates.actCost = body.actCost;
    if (body.hours !== undefined) updates.hours = body.hours;
    if (body.startedAt !== undefined) updates.startedAt = body.startedAt;
    if (body.completedAt !== undefined) updates.completedAt = body.completedAt;
    
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