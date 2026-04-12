import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const isRead = searchParams.get("isRead");
    
    let result;
    if (isRead !== null) {
      const isReadBool = isRead === "true";
      result = await db
        .select()
        .from(notifications)
        .where(eq(notifications.isRead, isReadBool))
        .orderBy(desc(notifications.createdAt));
    } else {
      result = await db
        .select()
        .from(notifications)
        .orderBy(desc(notifications.createdAt));
    }
    
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    
    const newNotification = {
      id: crypto.randomUUID(),
      projectId: body.projectId || null,
      type: body.type,
      title: body.title,
      message: body.message,
      isRead: false,
    };
    
    const inserted = await db.insert(notifications).values(newNotification).returning();
    
    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}