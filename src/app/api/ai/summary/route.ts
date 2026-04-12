import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { projects, transactions, tasks, milestones } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    
    const allProjects = await db.select().from(projects);
    const allTransactions = await db.select().from(transactions);
    const allTasks = await db.select().from(tasks);
    const allMilestones = await db.select().from(milestones);
    
    const summaries = await Promise.all(
      allProjects.map(async (project) => {
        const projectTxs = allTransactions.filter(t => t.projectId === project.id);
        const projectTasks = allTasks.filter(t => t.projectId === project.id);
        const projectMilestones = allMilestones.filter(m => m.projectId === project.id);
        
        const totalSpent = projectTxs
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalIncome = projectTxs
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const paidAmount = projectMilestones
          .filter(m => m.isPaid)
          .reduce((sum, m) => sum + m.amount, 0);
        
        const totalEstimated = projectTasks.reduce((sum, t) => sum + (t.estCost || 0), 0);
        const totalActual = projectTasks.reduce((sum, t) => sum + (t.actCost || 0), 0);
        
        const avgDailySpend = totalSpent > 0 ? totalSpent / 30 : 0;
        const remainingBudget = project.budget - totalSpent;
        const estimatedRunway = avgDailySpend > 0 ? Math.floor(remainingBudget / avgDailySpend) : 999;
        
        return {
          projectId: project.id,
          projectName: project.name,
          projectNumber: project.number,
          totalBudget: project.budget,
          totalSpent,
          totalIncome,
          paidAmount,
          unpaidAmount: project.budget - paidAmount,
          remainingBudget,
          burnRate: avgDailySpend,
          estimatedRunway,
          totalTasks: projectTasks.length,
          completedTasks: projectTasks.filter(t => t.status === 'done').length,
          totalEstimated,
          totalActual,
          variance: totalEstimated > 0 ? ((totalActual - totalEstimated) / totalEstimated) * 100 : 0,
        };
      })
    );
    
    return NextResponse.json({ data: summaries });
  } catch (error) {
    console.error("Error generating AI summary:", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}