import type { MetadataRoute } from "next";
import { BLOG_SLUGS } from "@/content/blog/posts";
import { NICHES } from "@/content/niches";
import { TOOLS } from "@/content/tools";
import { SITE_URL as BASE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/for-instagram`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/tools`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/ideas`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/signup`, changeFrequency: "yearly", priority: 0.5 },
  ];

  const toolRoutes: MetadataRoute.Sitemap = TOOLS.map((tool) => ({
    url: `${BASE_URL}/tools/${tool.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const blogRoutes: MetadataRoute.Sitemap = BLOG_SLUGS.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const ideaRoutes: MetadataRoute.Sitemap = NICHES.map((niche) => ({
    url: `${BASE_URL}/ideas/${niche.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...toolRoutes, ...blogRoutes, ...ideaRoutes];
}
