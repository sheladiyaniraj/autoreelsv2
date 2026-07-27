import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// This app is mostly public (marketing home, blog, share pages, pSEO
// pages, ...) with a small, fixed set of actually-private routes under
// the (app) layout group. An allowlist of *protected* prefixes is safer
// here than an allowlist of *public* ones — every new public route (blog
// posts, /share/[id], /ideas/[niche], ...) just works with no middleware
// change needed, instead of silently 307-redirecting to /login until
// someone notices (this has already bitten /billing, /library,
// /opengraph-image, and /blog in earlier passes).
const PROTECTED_PREFIXES = ["/dashboard", "/create", "/library", "/billing", "/admin", "/reels"];
const AUTH_ROUTE_PREFIXES = ["/login", "/signup", "/auth"];

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = AUTH_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // The overwhelming majority of page views on this app (blog, /tools,
  // /ideas, /share, ...) never look at auth state at all — only protected
  // routes and the auth/home redirects below do. Skip creating a Supabase
  // client and calling getUser() (a real network round-trip to Supabase's
  // Auth server, not a free local JWT decode) entirely for everything else,
  // instead of paying that cost on every single request site-wide.
  if (!isProtectedRoute && !isAuthRoute && pathname !== "/") {
    return NextResponse.next();
  }

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

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged-in-user redirect for "/" lives here (not in page.tsx) so the
  // marketing homepage itself can stay a plain static component with no
  // per-request Supabase call — that's what let it move from ~350-700ms
  // dynamic renders to a cached, edge-served ~130ms response for the
  // anonymous visitors who are the overwhelming majority of its traffic.
  if (user && (isAuthRoute || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
