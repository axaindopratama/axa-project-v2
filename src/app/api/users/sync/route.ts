import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { name, phone } = await request.json();
  const database = getDb();

  // Check if user exists in local database
  const existingUser = await database
    .select()
    .from(users)
    .where(eq(users.supabaseUserId, user.id))
    .limit(1);

  const now = new Date().toISOString();

  if (existingUser.length > 0) {
    // Update existing user
    await database
      .update(users)
      .set({
        name: name || existingUser[0].name,
        phone: phone || existingUser[0].phone,
        updatedAt: now,
      })
      .where(eq(users.id, existingUser[0].id));
  } else {
    // Create new user
    await database.insert(users).values({
      id: crypto.randomUUID(),
      supabaseUserId: user.id,
      email: user.email!,
      name: name,
      role: 'user',
      phone: phone,
      createdAt: now,
      updatedAt: now,
    });
  }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}