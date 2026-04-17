import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { projects, transactions, entities } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    
    // Get total projects
    const allProjects = await db.select().from(projects);
    const totalProjects = allProjects.length;
    
    // Calculate total budget and spent
    let totalBudget = 0;
    let totalSpent = 0;
    let activeProjects = 0;
    
    for (const project of allProjects) {
      totalBudget += project.budget;
      if (project.status === 'active' || project.status === 'in_progress') {
        activeProjects++;
      }
    }
    
    // Get total transactions (expense only for spent)
    const allTransactions = await db.select().from(transactions);
    for (const tx of allTransactions) {
      if (tx.type === 'expense') {
        totalSpent += tx.amount;
      }
    }
    
    // Get recent transactions (last 5)
    const recentTransactions = await db
      .select()
      .from(transactions)
      .orderBy(sql`${transactions.createdAt} DESC`)
      .limit(5);
    
    // Calculate burn rate (avg daily spending last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTxs = allTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= sevenDaysAgo;
    });
    
    const avgDailySpend = recentTxs.length > 0 
      ? recentTxs.reduce((sum, tx) => sum + tx.amount, 0) / 7 
      : 0;
    
    const estimatedRunway = avgDailySpend > 0 
      ? Math.floor((totalBudget - totalSpent) / avgDailySpend) 
      : 0;
    
    // Get entities count
    const allEntities = await db.select().from(entities);
    const vendors = allEntities.filter(e => e.type === 'vendor').length;
    const clients = allEntities.filter(e => e.type === 'client').length;
    
    return NextResponse.json({
      data: {
        totalProjects,
        activeProjects,
        totalBudget,
        totalSpent,
        totalRemaining: totalBudget - totalSpent,
        avgDailySpend,
        estimatedRunway,
        vendors,
        clients,
        recentTransactions,
        budgetUsagePercent: totalBudget > 0 
          ? Math.round((totalSpent / totalBudget) * 100) 
          : 0,
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}