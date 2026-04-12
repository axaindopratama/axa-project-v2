import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { milestones } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    
    if (projectId) {
      const result = await db
        .select()
        .from(milestones)
        .where(eq(milestones.projectId, projectId))
        .orderBy(desc(milestones.percentage));
      return NextResponse.json({ data: result });
    }
    
    const all = await db
      .select()
      .from(milestones)
      .orderBy(desc(milestones.percentage));
    return NextResponse.json({ data: all });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    
    if (!body.projectId || !body.title || body.amount === undefined || body.percentage === undefined) {
      return NextResponse.json(
        { error: "projectId, title, amount, and percentage are required" },
        { status: 400 }
      );
    }
    
    const newMilestone = {
      id: crypto.randomUUID(),
      projectId: body.projectId,
      title: body.title,
      amount: parseInt(body.amount) || 0,
      percentage: parseInt(body.percentage) || 0,
      dueDate: body.dueDate || null,
      isPaid: body.isPaid || false,
      paidAt: body.paidAt || null,
    };
    
    const inserted = await db.insert(milestones).values(newMilestone).returning();
    
    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating milestone:", error);
    return NextResponse.json(
      { error: "Failed to create milestone" },
      { status: 500 }
    );
  }
}