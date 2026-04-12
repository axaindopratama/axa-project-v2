import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { transactionItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const result = await db
      .select()
      .from(transactionItems)
      .where(eq(transactionItems.transactionId, id));
    
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error fetching transaction items:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}