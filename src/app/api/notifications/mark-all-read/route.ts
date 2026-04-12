import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    
    const updated = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.isRead, false))
      .returning();
    
    return NextResponse.json({ 
      data: { 
        markedCount: updated.length 
      } 
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 });
  }
}