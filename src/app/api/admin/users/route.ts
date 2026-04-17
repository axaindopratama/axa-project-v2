import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { normalizeUserRole } from '@/lib/rbac';

type AppRole = 'admin' | 'manager' | 'user';

const isValidRole = (role: unknown): role is AppRole =>
  role === 'admin' || role === 'manager' || role === 'user';

async function getAdminContext() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 as const };
  }

  const db = getDb();
  const currentUser = await db
    .select()
    .from(users)
    .where(eq(users.supabaseUserId, user.id))
    .limit(1);

  if (!currentUser[0] || currentUser[0].role !== 'admin') {
    return { error: 'Forbidden - Admin only', status: 403 as const };
  }

  return { db, currentUser: currentUser[0] };
}

export async function GET() {
  try {
    const context = await getAdminContext();
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
    const context = await getAdminContext();
    if ('error' in context) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }

    const { userId, name, phone, role, email } = await request.json();

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (role !== undefined && !isValidRole(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const targetUser = await context.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
    if (role !== undefined) updateData.role = normalizeUserRole(role);

    await context.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await getAdminContext();
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