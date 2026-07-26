export const BLOG_SLUGS = [
  "how-to-make-faceless-reels-with-ai",
  "best-ai-voices-for-tiktok-and-instagram-reels",
  "flux-vs-nano-banana-2-for-reels",
] as const;

export type BlogSlug = (typeof BLOG_SLUGS)[number];
