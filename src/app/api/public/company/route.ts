import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { companySettings } from "@/lib/db/schema";

export async function GET() {
  try {
    const db = getDb();
    const result = await db.select().from(companySettings).limit(1);
    const company = result[0];

    return NextResponse.json({
      data: {
        companyName: company?.companyName ?? "AXA PROJECT",
        companySubtitle: company?.companySubtitle ?? "CV. AXA INDO PRATAMA",
        logo: company?.logo ?? null,
      },
    });
  } catch (error) {
    console.error("Error fetching public company settings:", error);
    return NextResponse.json({ error: "Gagal mengambil data perusahaan" }, { status: 500 });
  }
}
