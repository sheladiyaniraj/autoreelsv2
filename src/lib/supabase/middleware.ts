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

  // This app is mostly public (marketing home, blog, share pages, pSEO
  // pages, ...) with a small, fixed set of actually-private routes under
  // the (app) layout group. An allowlist of *protected* prefixes is safer
  // here than an allowlist of *public* ones — every new public route (blog
  // posts, /share/[id], /ideas/[niche], ...) just works with no middleware
  // change needed, instead of silently 307-redirecting to /login until
  // someone notices (this has already bitten /billing, /library,
  // /opengraph-image, and /blog in earlier passes).
  const PROTECTED_PREFIXES = [
    "/dashboard",
    "/create",
    "/library",
    "/billing",
    "/admin",
    "/reels",
  ];
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

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
  if (user && (isAuthRoute || request.nextUrl.pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
