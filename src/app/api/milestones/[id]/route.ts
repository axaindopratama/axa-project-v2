import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { milestones } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const result = await db.select().from(milestones).where(eq(milestones.id, id));
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: result[0] });
  } catch (error) {
    console.error("Error fetching milestone:", error);
    return NextResponse.json({ error: "Failed to fetch milestone" }, { status: 500 });
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
    
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.amount !== undefined) updates.amount = parseInt(body.amount) || body.amount;
    if (body.percentage !== undefined) updates.percentage = parseInt(body.percentage) || body.percentage;
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate || null;
    if (body.isPaid !== undefined) {
      updates.isPaid = body.isPaid;
      updates.paidAt = body.isPaid ? new Date().toISOString() : null;
    }
    
    const updated = await db
      .update(milestones)
      .set(updates)
      .where(eq(milestones.id, id))
      .returning();
    
    if (updated.length === 0) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: updated[0] });
  } catch (error) {
    console.error("Error updating milestone:", error);
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 });
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
      .delete(milestones)
      .where(eq(milestones.id, id))
      .returning();
    
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: deleted[0] });
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json({ error: "Failed to delete milestone" }, { status: 500 });
  }
}