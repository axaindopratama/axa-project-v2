import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
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
    
    const updated = await db
      .update(transactions)
      .set({
        projectId: body.projectId,
        entityId: body.entityId || null,
        date: body.date,
        amount: body.amount,
        type: body.type,
        paymentStatus: body.paymentStatus,
        paidAmount: body.paidAmount || 0,
        dueDate: body.dueDate || null,
        paidDate: body.paidDate || null,
        paymentMethod: body.paymentMethod || null,
        receiptUrl: body.receiptUrl || null,
        notes: body.notes || null,
      })
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