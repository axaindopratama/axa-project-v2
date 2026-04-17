import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getDb } from '@/lib/db';
import { auditLogs, users } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { normalizeUserRole } from '@/lib/rbac';
import { z } from 'zod';
import { logRbacDecision } from '@/lib/audit';

type AppRole = 'admin' | 'manager' | 'user';

const isValidRole = (role: unknown): role is AppRole =>
  role === 'admin' || role === 'manager' || role === 'user';

const adminUserUpdatePayloadSchema = z.object({
  userId: z.string().min(1),
  name: z.string().optional(),
  phone: z.union([z.string(), z.null()]).optional(),
  role: z.enum(['admin', 'manager', 'user']).optional(),
  email: z.string().optional(),
  reason: z.string().optional(),
}).strict();

async function getAdminContext(request: Request) {
  const requestPath = new URL(request.url).pathname;

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    await logRbacDecision({
      path: requestPath,
      method: request.method,
      effectiveRole: null,
      roleSource: 'unknown',
      decision: 'DENY',
      reason: 'admin_context_unauthorized',
      metadata: {
        hasAuthError: Boolean(authError),
      },
    });

    return { error: 'Unauthorized', status: 401 as const };
  }

  const db = getDb();
  const currentUser = await db
    .select()
    .from(users)
    .where(eq(users.supabaseUserId, user.id))
    .limit(1);

  if (!currentUser[0] || currentUser[0].role !== 'admin') {
    await logRbacDecision({
      userId: user.id,
      path: requestPath,
      method: request.method,
      effectiveRole: currentUser[0]?.role ?? null,
      roleSource: 'turso',
      decision: 'DENY',
      reason: 'admin_context_forbidden',
    });

    return { error: 'Forbidden - Admin only', status: 403 as const };
  }

  await logRbacDecision({
    userId: user.id,
    path: requestPath,
    method: request.method,
    effectiveRole: currentUser[0].role,
    roleSource: 'turso',
    decision: 'ALLOW',
    reason: 'admin_context_allowed',
  });

  return { db, currentUser: currentUser[0] };
}

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request);
    if ('error' in context) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }

    const allUsers = await context.db
      .select({
        id: users.id,
        supabaseUserId: users.supabaseUserId,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        avatar: users.avatar,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const context = await getAdminContext(request);
    if ('error' in context) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }

    const rawPayload = await request.json();
    const payloadResult = adminUserUpdatePayloadSchema.safeParse(rawPayload);
    if (!payloadResult.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: payloadResult.error.issues },
        { status: 400 }
      );
    }

    const { userId, name, phone, role, email, reason } = payloadResult.data;
    const normalizedReason = reason?.trim();

    const targetUser = await context.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const normalizedTargetRoleBefore = normalizeUserRole(targetUser[0].role);
    const normalizedTargetRoleAfter = role !== undefined
      ? normalizeUserRole(role)
      : normalizedTargetRoleBefore;

    const isRoleChanged = normalizedTargetRoleBefore !== normalizedTargetRoleAfter;

    if (isRoleChanged && (!normalizedReason || normalizedReason.length === 0)) {
      return NextResponse.json({ error: 'Reason is required for role change' }, { status: 400 });
    }

    // Optional hardening: cegah self-demotion admin terakhir.
    const isSelfRoleUpdate = targetUser[0].id === context.currentUser.id;
    const isSelfDemotion = isSelfRoleUpdate && normalizedTargetRoleBefore === 'admin' && normalizedTargetRoleAfter !== 'admin';
    if (isSelfDemotion) {
      const adminUsers = await context.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, 'admin'));

      if (adminUsers.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot self-demote the last remaining admin' },
          { status: 400 }
        );
      }
    }

    const updateData: {
      name?: string;
      phone?: string | null;
      email?: string;
      role?: AppRole;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (typeof name === 'string') updateData.name = name;
    if (typeof phone === 'string' || phone === null) updateData.phone = phone;
    if (typeof email === 'string') updateData.email = email;
    if (role !== undefined && isValidRole(normalizedTargetRoleAfter)) {
      updateData.role = normalizedTargetRoleAfter;
    }

    await context.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    if (isRoleChanged) {
      await context.db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        userId: context.currentUser.supabaseUserId,
        action: 'ROLE_CHANGE',
        tableName: 'users',
        recordId: userId,
        oldValue: JSON.stringify({
          role: normalizedTargetRoleBefore,
        }),
        newValue: JSON.stringify({
          role: normalizedTargetRoleAfter,
          actorId: context.currentUser.supabaseUserId,
          reason: normalizedReason ?? '',
          timestamp: new Date().toISOString(),
        }),
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await getAdminContext(request);
    if ('error' in context) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (userId === context.currentUser.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await context.db
      .delete(users)
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}