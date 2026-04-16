import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { canAccessRoute, hasPermission, type UserRole } from '@/lib/rbac';
import { createAuditLog } from '@/lib/middleware/auditLog';

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

  // Log failed login attempts
  if (request.nextUrl.pathname === '/login' && request.method === 'POST') {
    try {
      const supabase = await createServerClient(
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
      const { data: { user: attemptedUser } } = await supabase.auth.getUser();
      
      await createAuditLog({
        action: 'LOGIN',
        resource: 'auth',
        details: {
          success: false,
          attemptedEmail: request.nextUrl.searchParams.get('email') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
    } catch (error) {
      console.error('Failed to log failed login attempt:', error);
    }
  }

  // Protected routes - require auth
  if (!user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Get user role from Supabase profiles table (primary source)
  let userRole: UserRole = 'user';
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role) {
      userRole = profile.role as UserRole;
    } else {
      // Fallback to metadata
      userRole = (user.user_metadata?.role as UserRole) || 'user';
    }
  } catch {
    // Fallback to metadata
    userRole = (user.user_metadata?.role as UserRole) || 'user';
  }
  
  // Try to get local user record for profile completeness check
  let userRecord: any[] = [];
  try {
    const db = getDb();
    userRecord = await db
      .select()
      .from(users)
      .where(eq(users.supabaseUserId, user.id))
      .limit(1);
  } catch {
    // Continue without local record
  }

  // Check route access
  const pathname = request.nextUrl.pathname;
  if (!canAccessRoute(userRole, pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Skip profile check for API routes
  if (pathname.startsWith('/api/')) {
    return response;
  }

  // Check profile completeness - redirect to /settings?setup=true if profile is incomplete
  const settingsPath = '/settings';
  const isSettingsPage = pathname === settingsPath;
  const isSetupMode = request.nextUrl.searchParams.get('setup') === 'true';

  if (!isSettingsPage || !isSetupMode) {
    if (!userRecord[0] || !userRecord[0].name || userRecord[0].name.trim() === '') {
      const redirectUrl = new URL(settingsPath, request.url);
      redirectUrl.searchParams.set('setup', 'true');
      return NextResponse.redirect(redirectUrl);
    }
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