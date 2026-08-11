import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { resolveExternalSource, SIGNUP_SOURCE_COOKIE } from "@/lib/site";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  // Capture first-touch attribution once, on whichever page a visitor
  // actually lands on (home, a blog post, a tool page, ...). Without this,
  // the source is only ever the Referer of the page the signup form was
  // on — which is this site itself for anyone who clicked through
  // internally before signing up, losing the real (e.g. ChatGPT) origin.
  if (!request.cookies.has(SIGNUP_SOURCE_COOKIE)) {
    const source = resolveExternalSource(request.nextUrl, request.headers.get("referer"));
    if (source) {
      response.cookies.set(SIGNUP_SOURCE_COOKIE, source, {
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|opengraph-image|twitter-image|icon|apple-icon|.well-known/workflow/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
