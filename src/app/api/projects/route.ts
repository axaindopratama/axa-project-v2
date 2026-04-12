import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));
    
    return NextResponse.json({ data: allProjects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    
    // Get latest project number
    const latest = await db
      .select({ number: projects.number })
      .from(projects)
      .orderBy(desc(projects.createdAt))
      .limit(1);
    
    let nextNumber = "001";
    if (latest.length > 0) {
      const num = parseInt(latest[0].number || "0") + 1;
      nextNumber = num.toString().padStart(3, "0");
    }
    
    const newProject = {
      id: crypto.randomUUID(),
      number: nextNumber,
      name: body.name,
      budget: parseInt(body.budget) || 0,
      status: body.status || "planning",
      hourlyRate: parseInt(body.hourlyRate) || 150000,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      createdAt: new Date().toISOString(),
    };
    
    const inserted = await db.insert(projects).values(newProject).returning();
    
    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}