import type { MetadataRoute } from "next";
import { BLOG_SLUGS } from "@/content/blog/posts";
import { NICHES } from "@/content/niches";
import { TOOLS } from "@/content/tools";
import { CREATORS } from "@/content/creators";
import { SITE_URL as BASE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/features`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/for-instagram`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/tools`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/ideas`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/faceless-youtube-channels`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/vs/autoreels-vs-canva-for-coaches`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/signup`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/refund`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const toolRoutes: MetadataRoute.Sitemap = TOOLS.map((tool) => ({
    url: `${BASE_URL}/tools/${tool.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const blogRoutes: MetadataRoute.Sitemap = await Promise.all(
    BLOG_SLUGS.map(async (slug) => {
      const mod = (await import(`@/content/blog/${slug}.mdx`)) as { metadata: { date: string } };
      return {
        url: `${BASE_URL}/blog/${slug}`,
        lastModified: new Date(mod.metadata.date),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      };
    })
  );

  const ideaRoutes: MetadataRoute.Sitemap = NICHES.map((niche) => ({
    url: `${BASE_URL}/ideas/${niche.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const creatorRoutes: MetadataRoute.Sitemap = CREATORS.map((creator) => ({
    url: `${BASE_URL}/faceless-youtube-channels/${creator.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...toolRoutes, ...blogRoutes, ...ideaRoutes, ...creatorRoutes];
}
