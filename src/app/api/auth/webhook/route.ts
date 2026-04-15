import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users, companySettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { type, email, user_metadata } = payload;

    // Only handle user signups
    if (type !== 'user.created') {
      return NextResponse.json({ received: true, processed: false });
    }

    const db = getDb();
    const supabaseUserId = payload.id;
    const name = user_metadata?.full_name || user_metadata?.name || email?.split('@')[0] || 'User';

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.supabaseUserId, supabaseUserId))
      .get();

    if (existingUser) {
      return NextResponse.json({ received: true, processed: false, reason: 'user_exists' });
    }

  // Create user in Turso - companyId will be set when user completes profile
  await db.insert(users).values({
    id: crypto.randomUUID(),
    supabaseUserId,
    email: email,
    name,
    role: 'user',
    companyId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: String(error) },
      { status: 500 }
    );
  }
}