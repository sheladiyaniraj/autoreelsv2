export const SITE_URL = "https://autoreels.in";

// Persists the first-touch external source (proxy.ts) across the internal
// hops a visitor takes before signing up — see resolveExternalSource below.
export const SIGNUP_SOURCE_COOKIE = "signup_source";

// Normalizes a Referer header into a signup-attribution source: the
// referring page's path for internal navigation (e.g. a tool or blog post),
// the external site's hostname for outside traffic (e.g. "google.com"), or
// "direct" when there's no referer at all (bookmarks, typed URLs, some
// privacy-focused browsers that strip it).
export function extractSignupSource(refererHeader: string | null): string {
  if (!refererHeader) return "direct";
  try {
    const referer = new URL(refererHeader);
    const site = new URL(SITE_URL);
    if (referer.hostname === site.hostname) {
      return referer.pathname || "/";
    }
    return referer.hostname;
  } catch {
    return "direct";
  }
}

// Identifies the *external* traffic source for a request, if any — a
// utm_source param or an off-site Referer. Used in proxy.ts to capture
// first-touch attribution into a cookie the moment a visitor arrives,
// since by the time they click "Sign up" the Referer header only points
// at whatever internal page they clicked it from (e.g. the homepage),
// which has already lost where that homepage visit itself came from.
export function resolveExternalSource(url: URL, refererHeader: string | null): string | null {
  const utmSource = url.searchParams.get("utm_source");
  if (utmSource) return utmSource;
  if (!refererHeader) return null;
  try {
    const referer = new URL(refererHeader);
    const site = new URL(SITE_URL);
    if (referer.hostname === site.hostname) return null;
    return referer.hostname;
  } catch {
    return null;
  }
}
