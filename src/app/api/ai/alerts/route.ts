import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { projects, transactions } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    
    const allProjects = await db.select().from(projects);
    const allTransactions = await db.select().from(transactions);
    
    const alerts: {
      id: string;
      projectId: string;
      projectName: string;
      projectNumber: string;
      alertType: string;
      thresholdPercentage: number;
      currentPercentage: number;
      currentSpent: number;
      isTriggered: boolean;
      triggeredAt: string;
    }[] = [];
    
    for (const project of allProjects) {
      const projectTxs = allTransactions.filter(t => t.projectId === project.id && t.type === 'expense');
      const spent = projectTxs.reduce((sum, t) => sum + t.amount, 0);
      const percentage = project.budget > 0 ? (spent / project.budget) * 100 : 0;
      
      if (percentage >= 80) {
        alerts.push({
          id: `${project.id}-critical`,
          projectId: project.id,
          projectName: project.name,
          projectNumber: project.number,
          alertType: 'critical',
          thresholdPercentage: 80,
          currentPercentage: Math.round(percentage),
          currentSpent: spent,
          isTriggered: true,
          triggeredAt: new Date().toISOString(),
        });
      } else if (percentage >= 60) {
        alerts.push({
          id: `${project.id}-warning`,
          projectId: project.id,
          projectName: project.name,
          projectNumber: project.number,
          alertType: 'warning',
          thresholdPercentage: 60,
          currentPercentage: Math.round(percentage),
          currentSpent: spent,
          isTriggered: true,
          triggeredAt: new Date().toISOString(),
        });
      }
    }
    
    return NextResponse.json({ data: alerts });
  } catch (error) {
    console.error("Error fetching budget alerts:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}