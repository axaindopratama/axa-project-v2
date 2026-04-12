import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { transactions, transactionItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const result = await db.select().from(transactions).where(eq(transactions.id, id));
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: result[0] });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 });
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
    if (body.projectId !== undefined) updates.projectId = body.projectId;
    if (body.entityId !== undefined) updates.entityId = body.entityId || null;
    if (body.date !== undefined) updates.date = body.date;
    if (body.amount !== undefined) updates.amount = parseInt(body.amount) || body.amount;
    if (body.type !== undefined) updates.type = body.type;
    if (body.paymentStatus !== undefined) updates.paymentStatus = body.paymentStatus;
    if (body.paidAmount !== undefined) updates.paidAmount = parseInt(body.paidAmount) || body.paidAmount || 0;
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate || null;
    if (body.paidDate !== undefined) updates.paidDate = body.paidDate || null;
    if (body.paymentMethod !== undefined) updates.paymentMethod = body.paymentMethod || null;
    if (body.receiptUrl !== undefined) updates.receiptUrl = body.receiptUrl || null;
    if (body.notes !== undefined) updates.notes = body.notes || null;
    
    const updated = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    
    if (updated.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: updated[0] });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    
    // Delete related transaction items first
    await db.delete(transactionItems).where(eq(transactionItems.transactionId, id));
    
    // Delete the transaction
    const deleted = await db
      .delete(transactions)
      .where(eq(transactions.id, id))
      .returning();
    
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: deleted[0] });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}