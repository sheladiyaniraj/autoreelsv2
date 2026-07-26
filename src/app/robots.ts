import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/create", "/library", "/billing", "/admin", "/reels", "/api"],
    },
    sitemap: "https://autoreels-one.vercel.app/sitemap.xml",
  };
}
