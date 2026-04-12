import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const result = await db
      .select()
      .from(transactions)
      .where(eq(transactions.entityId, id))
      .orderBy(desc(transactions.date));
    
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error fetching entity transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}