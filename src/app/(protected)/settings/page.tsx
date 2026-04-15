import { getDb } from "@/lib/db";
import { projects, transactions, entities, users, companySettings, auditLogs } from "@/lib/db/schema";
import SettingsPageClient from "./SettingsPageClient";

export const dynamic = "force-dynamic";

async function getSystemStats() {
  const db = getDb();
  try {
    const allProjects = await db.select().from(projects);
    const allTransactions = await db.select().from(transactions);
    const allEntities = await db.select().from(entities);
    const allUsers = await db.select().from(users);
    const allAuditLogs = await db.select().from(auditLogs);
    const companyData = await db.select().from(companySettings).limit(1);

    const totalBudget = allProjects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = allTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = allTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);

    return {
      projects: allProjects.length,
      transactions: allTransactions.length,
      entities: allEntities.length,
      users: allUsers.length,
      auditLogs: allAuditLogs.length,
      totalBudget,
      totalSpent,
      totalIncome,
      uptime: "99.9%",
      companyData: companyData[0] || null,
      lastSync: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching system stats:", error);
    return {
      projects: 0,
      transactions: 0,
      entities: 0,
      users: 0,
      auditLogs: 0,
      totalBudget: 0,
      totalSpent: 0,
      totalIncome: 0,
      uptime: "99.9%",
      companyData: null,
      lastSync: new Date().toISOString(),
    };
  }
}

export default async function SettingsPage() {
  const stats = await getSystemStats();

  const normalizedStats = {
    ...stats,
    companyData: stats.companyData ? {
      id: stats.companyData.id || "",
      companyName: stats.companyData.companyName || "",
      companyAddress: stats.companyData.companyAddress || "",
      companyPhone: stats.companyData.companyPhone || "",
      companyEmail: stats.companyData.companyEmail || "",
      companyNpwp: stats.companyData.companyNpwp || "",
      companySubtitle: stats.companyData.companySubtitle || "",
      logo: stats.companyData.logo || "",
    } : null,
  };

  return <SettingsPageClient stats={normalizedStats} />;
}
