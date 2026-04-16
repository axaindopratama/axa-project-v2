import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { transactions, transactionItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

const createTransactionSchema = z.object({
  projectId: z.string().min(1, "Project ID wajib diisi"),
  entityId: z.string().optional(),
  date: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  type: z.enum(["expense", "income"]).optional(),
  paymentStatus: z.enum(["lunas", "belum-lunas", "dicicil"]).optional(),
  paidAmount: z.union([z.string(), z.number()]).optional(),
  dueDate: z.string().optional(),
  paidDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().optional(),
    qty: z.union([z.string(), z.number()]).optional(),
    unitPrice: z.union([z.string(), z.number()]).optional(),
    totalPrice: z.union([z.string(), z.number()]).optional(),
  })).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    
    if (projectId) {
      const result = await db
        .select()
        .from(transactions)
        .where(eq(transactions.projectId, projectId))
        .orderBy(desc(transactions.date));
      return NextResponse.json({ data: result });
    }
    
    const allTransactions = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.date));
    return NextResponse.json({ data: allTransactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    
    const validation = createTransactionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { 
      projectId, entityId, date, amount, type, paymentStatus, 
      paidAmount, dueDate, paidDate, paymentMethod, receiptUrl, notes, items 
    } = validation.data;
    
    const newTransaction = {
      id: crypto.randomUUID(),
      projectId,
      entityId: entityId || null,
      date: date || new Date().toISOString().split("T")[0],
      amount: parseInt(String(amount)) || 0,
      type: type || "expense",
      paymentStatus: paymentStatus || "lunas",
      paidAmount: parseInt(String(paidAmount)) || 0,
      dueDate: dueDate || null,
      paidDate: paidDate || null,
      paymentMethod: paymentMethod || null,
      receiptUrl: receiptUrl || null,
      notes: notes || null,
      createdAt: new Date().toISOString(),
    };
    
    const inserted = await db.insert(transactions).values(newTransaction).returning();
    const transactionId = inserted[0].id;

    // Automated Budget Notification
    if (newTransaction.type === 'expense') {
      try {
        const { projects, projectSettings, notifications } = await import("@/lib/db/schema");
        const { and } = await import("drizzle-orm");
        
        const projectData = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
        if (projectData.length > 0) {
          const project = projectData[0];
          const allTxs = await db.select().from(transactions).where(and(eq(transactions.projectId, projectId), eq(transactions.type, 'expense')));
          const totalSpent = allTxs.reduce((sum, t) => sum + t.amount, 0);
          
          if (project.budget > 0) {
            const percentage = (totalSpent / project.budget) * 100;
            const settingsData = await db.select().from(projectSettings).where(eq(projectSettings.projectId, project.id)).limit(1);
            const settings = settingsData[0];
            
            const criticalThreshold = settings?.alertThresholdCritical ?? 80;
            const warningThreshold = settings?.alertThresholdWarning ?? 60;
            
            // Only trigger if this specific transaction pushed it over the threshold
            // Actually, simpler approach: just check if it's over, and maybe we can prevent duplicate notifications later
            // But for now, we just insert. To prevent spam, we could check if a notification was already sent today.
            
            if (percentage >= criticalThreshold) {
              await db.insert(notifications).values({
                id: crypto.randomUUID(),
                projectId: project.id,
                type: 'budget_alert',
                title: 'Kritis: Budget Hampir Habis',
                message: `Pengeluaran proyek ${project.name} telah mencapai ${percentage.toFixed(1)}% dari budget.`,
              });
            } else if (percentage >= warningThreshold) {
              await db.insert(notifications).values({
                id: crypto.randomUUID(),
                projectId: project.id,
                type: 'budget_alert',
                title: 'Peringatan Budget',
                message: `Pengeluaran proyek ${project.name} telah mencapai ${percentage.toFixed(1)}% dari budget.`,
              });
            }
          }
        }
      } catch (e) {
        console.error("Failed to process budget notifications:", e);
      }
    }

    if (items && Array.isArray(items) && items.length > 0) {
      const itemsToInsert = items.map((item) => ({
        id: crypto.randomUUID(),
        transactionId,
        description: item.description || "",
        qty: parseInt(String(item.qty)) || 1,
        unitPrice: parseInt(String(item.unitPrice)) || 0,
        totalPrice: parseInt(String(item.totalPrice)) || 0,
      }));

      await db.insert(transactionItems).values(itemsToInsert);
    }
    
    revalidatePath("/transactions");
    revalidatePath("/keuangan");
    revalidatePath("/");
    
    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating transaction:", error.message, error.stack);
    return NextResponse.json(
      { error: `Failed to create transaction: ${error.message}` },
      { status: 500 }
    );
  }
}
