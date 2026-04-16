import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    if (!hasPermission(auth.user.role, "tasks:read")) {
      return NextResponse.json({ error: "Forbidden - No permission" }, { status: 403 });
    }

    const db = getDb();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    
    let result;
    
    if (projectId && status) {
      result = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.projectId, projectId), eq(tasks.status, status)));
    } else if (projectId) {
      result = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId));
    } else {
      result = await db.select().from(tasks);
    }
    
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    if (!hasPermission(auth.user.role, "tasks:create")) {
      return NextResponse.json({ error: "Forbidden - No permission to create task" }, { status: 403 });
    }

    const db = getDb();
    const body = await req.json();
    
    if (!body.projectId || !body.title) {
      return NextResponse.json(
        { error: "projectId and title are required" },
        { status: 400 }
      );
    }
    
    const newTask = {
      id: crypto.randomUUID(),
      projectId: body.projectId,
      assignedTo: body.assignedTo || null,
      title: body.title,
      status: body.status || 'todo',
      estCost: parseInt(body.estCost) || 0,
      actCost: parseInt(body.actCost) || 0,
      hours: parseFloat(body.hours) || 0,
      startedAt: body.startedAt || null,
      completedAt: body.completedAt || null,
    };
    
    const inserted = await db.insert(tasks).values(newTask).returning();
    
    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}