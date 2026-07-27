export const SITE_URL = "https://autoreels.in";

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
