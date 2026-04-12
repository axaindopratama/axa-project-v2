import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { projectSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const defaultSettings = {
  hourlyRate: 150000,
  currency: "IDR",
  alertThresholdWarning: 60,
  alertThresholdCritical: 80,
  autoNumbering: true,
  numberingFormat: "XXX",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (projectId) {
      const db = getDb();
      const result = await db
        .select()
        .from(projectSettings)
        .where(eq(projectSettings.projectId, projectId))
        .limit(1);
      
      if (result.length > 0) {
        return NextResponse.json({ data: result[0] });
      }
    }

    return NextResponse.json({ data: defaultSettings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    
    const projectId = body.projectId;
    
    if (!projectId) {
      return NextResponse.json({ data: { ...defaultSettings, ...body } });
    }

    const existing = await db
      .select()
      .from(projectSettings)
      .where(eq(projectSettings.projectId, projectId))
      .limit(1);

    let result;
    if (existing.length > 0) {
      result = await db
        .update(projectSettings)
        .set({
          hourlyRate: body.hourlyRate,
          alertThresholdWarning: body.alertThresholdWarning,
          alertThresholdCritical: body.alertThresholdCritical,
        })
        .where(eq(projectSettings.projectId, projectId))
        .returning();
    } else {
      result = await db
        .insert(projectSettings)
        .values({
          id: crypto.randomUUID(),
          projectId,
          hourlyRate: body.hourlyRate || 150000,
          alertThresholdWarning: body.alertThresholdWarning || 60,
          alertThresholdCritical: body.alertThresholdCritical || 80,
        })
        .returning();
    }

    return NextResponse.json({ data: result[0] });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}