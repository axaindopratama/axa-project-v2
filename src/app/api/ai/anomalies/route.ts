import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";

export async function GET() {
  try {
    const db = getDb();
    
    const allProjects = await db.select().from(projects);
    const allTasks = await db.select().from(tasks);
    
    const anomalies: {
      id: string;
      projectId: string;
      projectName: string;
      taskId: string;
      taskTitle: string;
      estimatedCost: number;
      actualCost: number;
      variancePercentage: number;
      detectedAt: string;
    }[] = [];
    
    for (const project of allProjects) {
      const projectTasks = allTasks.filter(t => t.projectId === project.id && t.status === 'done');
      
      for (const task of projectTasks) {
        if (task.estCost && task.actCost && task.estCost > 0) {
          const variance = ((task.actCost - task.estCost) / task.estCost) * 100;
          
          if (variance > 20) {
            anomalies.push({
              id: `${task.id}-anomaly`,
              projectId: project.id,
              projectName: project.name,
              taskId: task.id,
              taskTitle: task.title,
              estimatedCost: task.estCost,
              actualCost: task.actCost,
              variancePercentage: Math.round(variance * 10) / 10,
              detectedAt: task.completedAt || new Date().toISOString(),
            });
          }
        }
      }
    }
    
    return NextResponse.json({ data: anomalies });
  } catch (error) {
    console.error("Error fetching anomalies:", error);
    return NextResponse.json({ error: "Failed to fetch anomalies" }, { status: 500 });
  }
}