import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { 
  projects, transactions, entities, tasks, 
  transactionItems, projectSettings, notifications, auditLogs,
  users, companySettings
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!hasPermission(auth.user.role, "backup:create")) {
    return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
  }
  try {
    const db = getDb();

    const allProjects = await db.select().from(projects);
    const allTransactions = await db.select().from(transactions);
    const allEntities = await db.select().from(entities);
    const allTasks = await db.select().from(tasks);
    const allTransactionItems = await db.select().from(transactionItems);
    const allProjectSettings = await db.select().from(projectSettings);
    const allNotifications = await db.select().from(notifications);
    const allAuditLogs = await db.select().from(auditLogs);
    const allUsers = await db.select().from(users);
    const allCompanySettings = await db.select().from(companySettings);

    const backup = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      tables: {
        projects: allProjects,
        transactions: allTransactions,
        entities: allEntities,
        tasks: allTasks,
        transactionItems: allTransactionItems,
        projectSettings: allProjectSettings,
        notifications: allNotifications,
        auditLogs: allAuditLogs,
        users: allUsers,
        companySettings: allCompanySettings,
      },
    };

    const jsonStr = JSON.stringify(backup, null, 2);

    return new NextResponse(jsonStr, {
      headers: {
        "Content-Type": "application/json; charset=utf-8;",
        "Content-Disposition": `attachment; filename="axa-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    return NextResponse.json({ error: "Gagal membuat backup" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    if (!hasPermission(auth.user.role, "backup:restore")) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const body = await req.json();
    
    if (!body.tables) {
      return NextResponse.json({ error: "Format backup tidak valid" }, { status: 400 });
    }

    const db = getDb();
    const results: string[] = [];

    if (body.tables.projects?.length > 0) {
      for (const project of body.tables.projects) {
        const existing = await db.select().from(projects).where(eq(projects.id, project.id)).limit(1);
        if (existing.length > 0) {
          await db.update(projects).set(project).where(eq(projects.id, project.id));
        } else {
          await db.insert(projects).values(project);
        }
      }
      results.push(`Restored ${body.tables.projects.length} projects`);
    }

    if (body.tables.entities?.length > 0) {
      for (const entity of body.tables.entities) {
        const existing = await db.select().from(entities).where(eq(entities.id, entity.id)).limit(1);
        if (existing.length > 0) {
          await db.update(entities).set(entity).where(eq(entities.id, entity.id));
        } else {
          await db.insert(entities).values(entity);
        }
      }
      results.push(`Restored ${body.tables.entities.length} entities`);
    }

    if (body.tables.users?.length > 0) {
      for (const user of body.tables.users) {
        const existing = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
        if (existing.length > 0) {
          await db.update(users).set(user).where(eq(users.id, user.id));
        } else {
          await db.insert(users).values(user);
        }
      }
      results.push(`Restored ${body.tables.users.length} users`);
    }

    if (body.tables.companySettings?.length > 0) {
      const cs = body.tables.companySettings[0];
      const existing = await db.select().from(companySettings).limit(1);
      if (existing.length > 0) {
        await db.update(companySettings).set(cs).where(eq(companySettings.id, existing[0].id));
      } else {
        await db.insert(companySettings).values(cs);
      }
      results.push("Restored company settings");
    }

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      action: "restore",
      tableName: "backup",
      recordId: "system",
      newValue: JSON.stringify(results),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      message: "Backup berhasil dipulihkan",
      details: results 
    });
  } catch (error) {
    console.error("Error restoring backup:", error);
    return NextResponse.json({ error: "Gagal memulihkan backup" }, { status: 500 });
  }
}
