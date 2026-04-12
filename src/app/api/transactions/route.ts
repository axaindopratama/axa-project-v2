import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    
    if (projectId) {
      const result = await db
        .select()
        .from(transactions)
        .where(eq(transactions.projectId, projectId))
        .orderBy(desc(transactions.date));
      return NextResponse.json({ data: result });
    }
    
    const allTransactions = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.date));
    return NextResponse.json({ data: allTransactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    
    const newTransaction = {
      id: crypto.randomUUID(),
      projectId: body.projectId,
      entityId: body.entityId || null,
      date: body.date || new Date().toISOString().split("T")[0],
      amount: parseInt(body.amount) || 0,
      type: body.type || "expense",
      paymentStatus: body.paymentStatus || "lunas",
      paidAmount: parseInt(body.paidAmount) || 0,
      dueDate: body.dueDate || null,
      paidDate: body.paidDate || null,
      paymentMethod: body.paymentMethod || null,
      receiptUrl: body.receiptUrl || null,
      notes: body.notes || null,
      createdAt: new Date().toISOString(),
    };
    
    const inserted = await db.insert(transactions).values(newTransaction).returning();
    
    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}