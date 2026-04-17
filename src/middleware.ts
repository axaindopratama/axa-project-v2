import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { canAccessRoute, resolveSupabaseUserRole, type UserRole } from '@/lib/rbac';
import { getOrProvisionAppUser } from '@/lib/userProvisioning';
import { logAccessDenied } from '@/lib/audit';

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

  // Turso-first role/profile context with lazy provisioning
  let userRole: UserRole = 'user';
  let appUser: Awaited<ReturnType<typeof getOrProvisionAppUser>> | null = null;
  const pathname = request.nextUrl.pathname;

  try {
    appUser = await getOrProvisionAppUser(user);
    userRole = appUser.role;
  } catch (error) {
    // Hardening: block request when Turso context cannot be ensured.
    await logAccessDenied({
      userId: user.id,
      path: pathname,
      method: request.method,
      role: resolveSupabaseUserRole(user),
      reason: 'user_provisioning_failed',
      metadata: {
        message: error instanceof Error ? error.message : 'unknown_error',
      },
    });

    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'User profile setup required' },
        { status: 503 }
      );
    }

    const redirectUrl = new URL('/settings', request.url);
    redirectUrl.searchParams.set('setup', 'true');
    return NextResponse.redirect(redirectUrl);
  }

  // API routes memakai permission check masing-masing endpoint.
  // Middleware route-guard difokuskan ke halaman.
  if (pathname.startsWith('/api/')) {
    return response;
  }

  // Check route access
  if (!canAccessRoute(userRole, pathname)) {
    await logAccessDenied({
      userId: user.id,
      path: pathname,
      method: request.method,
      role: userRole,
      reason: 'route_guard_denied',
    });

    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check profile completeness - redirect to /settings?setup=true if profile is incomplete
  const settingsPath = '/settings';
  const isSettingsPage = pathname === settingsPath;
  const isSetupMode = request.nextUrl.searchParams.get('setup') === 'true';

  if (!isSettingsPage || !isSetupMode) {
    if (!appUser || !appUser.name || appUser.name.trim() === '') {
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