import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { projects, transactions, entities, tasks } from "@/lib/db/schema";

function convertToCSV(data: Array<Record<string, unknown>>, headers: string[]): string {
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    let data: Array<Record<string, unknown>> = [];
    let filename = "export.csv";
    let headers: string[] = [];

    if (type === "projects") {
      data = await db.select().from(projects);
      headers = ["id", "number", "name", "budget", "status", "startDate", "endDate", "createdAt"];
      filename = "proyek.csv";
    } else if (type === "transactions") {
      const allTransactions = await db.select().from(transactions);
      const allEntities = await db.select().from(entities);
      const entityMap = new Map(allEntities.map(e => [e.id, e.name]));
      
      data = allTransactions.map(t => ({
        ...t,
        entityName: t.entityId ? entityMap.get(t.entityId) : "",
      }));
      headers = ["id", "projectId", "entityName", "date", "amount", "type", "paymentStatus", "notes", "createdAt"];
      filename = "transaksi.csv";
    } else if (type === "entities") {
      data = await db.select().from(entities);
      headers = ["id", "name", "type", "contact", "email", "phone", "address", "createdAt"];
      filename = "entitas.csv";
    } else if (type === "tasks") {
      data = await db.select().from(tasks);
      headers = ["id", "projectId", "title", "status", "estCost", "actCost", "hours", "startedAt", "completedAt"];
      filename = "tugas.csv";
    } else {
      return NextResponse.json({ error: "Tipe export tidak valid" }, { status: 400 });
    }

    const csv = convertToCSV(data, headers);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8;",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json({ error: "Gagal mengekspor data" }, { status: 500 });
  }
}
