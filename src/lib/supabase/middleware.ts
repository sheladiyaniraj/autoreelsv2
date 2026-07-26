import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/auth");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  const isShareRoute = request.nextUrl.pathname.startsWith("/share");
  // Every route under the (app) layout group requires auth — allowlisting
  // just "/dashboard" and "/create" here let /billing, /library, and
  // /reels/[id] fall through to the page render unauthenticated, which
  // still correctly redirects (the (app) layout has its own check) but only
  // after throwing on `user!.id` in the page's data-fetch first, showing up
  // as noisy TypeErrors in production logs instead of a clean edge redirect.
  // API routes are excluded — they do their own auth (401 JSON, not a
  // redirect), and some (e.g. the Stripe webhook) never have a user session.
  // /share/[id] is a deliberately public, unauthenticated page.
  const isPublicRoute =
    request.nextUrl.pathname === "/" || isAuthRoute || isApiRoute || isShareRoute;
  const isProtectedRoute = !isPublicRoute;

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
