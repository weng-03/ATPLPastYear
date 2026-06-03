import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

/**
 * Middleware that refreshes the Supabase auth session on every request.
 *
 * This prevents users from being logged out when their JWT expires mid-session.
 * It also handles redirecting unauthenticated users away from protected routes.
 *
 * Add to next.config.ts matcher OR call from your existing middleware.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do not remove this line.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected route logic: redirect unauthenticated users to /login
  const { pathname } = request.nextUrl;
  const isPublicRoute = pathname.startsWith('/login') || pathname.startsWith('/auth');

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
