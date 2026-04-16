import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

const createProjectSchema = z.object({
  name: z.string().min(1, "Nama proyek wajib diisi"),
  budget: z.union([z.string(), z.number()]).optional(),
  status: z.enum(["planning", "active", "completed", "on-hold"]).optional(),
  hourlyRate: z.union([z.string(), z.number()]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    if (!hasPermission(auth.user.role, "projects:read")) {
      return NextResponse.json({ error: "Forbidden - No permission" }, { status: 403 });
    }
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
    const auth = await getAuthenticatedUser(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    if (!hasPermission(auth.user.role, "projects:create")) {
      return NextResponse.json({ error: "Forbidden - No permission to create project" }, { status: 403 });
    }

    const db = getDb();
    const body = await req.json();
    
    const validation = createProjectSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { name, budget, status, hourlyRate, startDate, endDate } = validation.data;
    
    const maxProject = await db
      .select({ number: projects.number })
      .from(projects)
      .orderBy(sql`CAST(${projects.number} AS INTEGER) DESC`)
      .limit(1);
    
    let nextNumber = "001";
    if (maxProject.length > 0) {
      const maxNum = parseInt(maxProject[0].number || "0");
      nextNumber = (maxNum + 1).toString().padStart(3, "0");
    }
    
    const newProject = {
      id: crypto.randomUUID(),
      number: nextNumber,
      name,
      budget: parseInt(String(budget)) || 0,
      status: status || "planning",
      hourlyRate: parseInt(String(hourlyRate)) || 150000,
      startDate: startDate || null,
      endDate: endDate || null,
      createdAt: new Date().toISOString(),
    };
    
    const inserted = await db.insert(projects).values(newProject).returning();
    
    revalidatePath("/projects");
    revalidatePath("/");
    
    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
