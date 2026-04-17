import { getDb } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

interface AccessDeniedLogParams {
  userId?: string | null;
  path: string;
  method?: string;
  role?: string | null;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface RbacDecisionLogParams {
  userId?: string | null;
  path: string;
  method?: string;
  effectiveRole?: string | null;
  roleSource?: "turso" | "supabase_metadata" | "unknown";
  decision: "ALLOW" | "DENY";
  reason: string;
  metadata?: Record<string, unknown>;
}

type ParsedRbacLog = {
  role?: string | null;
  reason?: string;
};

export async function logAccessDenied(params: AccessDeniedLogParams) {
  await logRbacDecision({
    userId: params.userId,
    path: params.path,
    method: params.method,
    effectiveRole: params.role ?? null,
    roleSource: "unknown",
    decision: "DENY",
    reason: params.reason,
    metadata: params.metadata,
  });
}

export async function logRbacDecision(params: RbacDecisionLogParams) {
  try {
    const db = getDb();
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: params.userId ?? null,
      action: params.decision === "DENY" ? "ACCESS_DENIED" : "ACCESS_ALLOWED",
      tableName: "rbac",
      recordId: params.path,
      oldValue: null,
      newValue: JSON.stringify({
        path: params.path,
        method: params.method,
        role: params.effectiveRole ?? null,
        effectiveRole: params.effectiveRole ?? null,
        roleSource: params.roleSource ?? "unknown",
        decision: params.decision,
        reason: params.reason,
        ...(params.metadata ? { metadata: params.metadata } : {}),
      }),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to write RBAC audit log:", error);
  }
}

export async function getRbacMetrics() {
  const db = getDb();
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(1000);

  const deniedByRole: Record<string, number> = {};
  let roleChangeEvents = 0;
  let provisioningFailures = 0;

  for (const log of logs) {
    if (log.action === "ROLE_CHANGE") {
      roleChangeEvents += 1;
      continue;
    }

    if (log.tableName !== "rbac" || !log.newValue) continue;

    let parsed: ParsedRbacLog = {};
    try {
      parsed = JSON.parse(log.newValue) as ParsedRbacLog;
    } catch {
      parsed = {};
    }

    if (log.action === "ACCESS_DENIED") {
      const role = parsed.role || "unknown";
      deniedByRole[role] = (deniedByRole[role] || 0) + 1;
    }

    if (parsed.reason === "user_provisioning_failed") {
      provisioningFailures += 1;
    }
  }

  return {
    deniedByRole,
    roleChangeEvents,
    provisioningFailures,
    sampledLogCount: logs.length,
  };
}