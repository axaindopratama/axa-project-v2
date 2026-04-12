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
    
    const entityTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.entityId, id));
    
    const totalIncome = entityTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = entityTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const unpaidAmount = entityTransactions
      .filter(t => t.type === "expense" && t.paymentStatus !== "lunas")
      .reduce((sum, t) => sum + (t.amount - (t.paidAmount || 0)), 0);
    
    return NextResponse.json({
      data: {
        totalTransactions: entityTransactions.length,
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense,
        unpaidAmount,
      }
    });
  } catch (error) {
    console.error("Error fetching entity stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}