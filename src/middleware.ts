import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { canAccessRoute, type UserRole } from '@/lib/rbac';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();

  // Public routes - allow access
  const publicRoutes = ['/login', '/api/auth'];
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    // If logged in, redirect to dashboard
    if (user && request.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  // Protected routes - require auth
  if (!user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Get user role from metadata or database
  let userRole: UserRole = (user.user_metadata?.role as UserRole) || 'user';
  
  // Try to get role from local database
  try {
    const db = getDb();
    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.supabaseUserId, user.id))
      .limit(1);
    
    if (dbUser[0]?.role) {
      userRole = dbUser[0].role as UserRole;
    }
  } catch {
    // Use metadata role as fallback
  }

  // Check route access
  const pathname = request.nextUrl.pathname;
  if (!canAccessRoute(userRole, pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Add user info to headers for API routes
  response.headers.set('x-user-id', user.id);
  response.headers.set('x-user-role', userRole);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};