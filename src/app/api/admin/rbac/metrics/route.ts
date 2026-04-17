import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getRbacMetrics, logRbacDecision } from '@/lib/audit';

export async function GET(request: Request) {
  const path = new URL(request.url).pathname;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      await logRbacDecision({
        path,
        method: request.method,
        effectiveRole: null,
        roleSource: 'unknown',
        decision: 'DENY',
        reason: 'admin_metrics_unauthorized',
        metadata: {
          hasAuthError: Boolean(authError),
        },
      });

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const currentUser = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.supabaseUserId, user.id))
      .limit(1);

    if (!currentUser[0] || currentUser[0].role !== 'admin') {
      await logRbacDecision({
        userId: user.id,
        path,
        method: request.method,
        effectiveRole: currentUser[0]?.role ?? null,
        roleSource: 'turso',
        decision: 'DENY',
        reason: 'admin_metrics_forbidden',
      });

      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const metrics = await getRbacMetrics();

    await logRbacDecision({
      userId: user.id,
      path,
      method: request.method,
      effectiveRole: currentUser[0].role,
      roleSource: 'turso',
      decision: 'ALLOW',
      reason: 'admin_metrics_read',
    });

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error getting RBAC metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
