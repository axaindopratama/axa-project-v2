import { getDb } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

interface AccessDeniedLogParams {
  userId?: string | null;
  path: string;
  method?: string;
  role?: string | null;
  reason: string;
  metadata?: Record<string, unknown>;
}

export async function logAccessDenied(params: AccessDeniedLogParams) {
  try {
    const db = getDb();
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: params.userId ?? null,
      action: "ACCESS_DENIED",
      tableName: "rbac",
      recordId: params.path,
      oldValue: null,
      newValue: JSON.stringify({
        path: params.path,
        method: params.method,
        role: params.role ?? null,
        reason: params.reason,
        ...(params.metadata ? { metadata: params.metadata } : {}),
      }),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to write access denied audit log:", error);
  }
}