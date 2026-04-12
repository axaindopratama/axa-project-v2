import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { transactionItems } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    
    const newItem = {
      id: crypto.randomUUID(),
      transactionId: body.transactionId,
      description: body.description,
      qty: parseInt(body.qty) || 1,
      unitPrice: parseInt(body.unitPrice) || 0,
      totalPrice: (parseInt(body.qty) || 1) * (parseInt(body.unitPrice) || 0),
    };
    
    const inserted = await db.insert(transactionItems).values(newItem).returning();
    
    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction item:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}