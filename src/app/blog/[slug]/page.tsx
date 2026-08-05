import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BLOG_SLUGS, type BlogSlug } from "@/content/blog/posts";
import { SITE_URL } from "@/lib/site";

type PostMeta = { title: string; description: string; date: string };

function isValidSlug(slug: string): slug is BlogSlug {
  return (BLOG_SLUGS as readonly string[]).includes(slug);
}

export function generateStaticParams() {
  return BLOG_SLUGS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidSlug(slug)) return {};

  const mod = (await import(`@/content/blog/${slug}.mdx`)) as { metadata: PostMeta };
  return {
    title: mod.metadata.title,
    description: mod.metadata.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { title: mod.metadata.title, description: mod.metadata.description, type: "article" },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidSlug(slug)) {
    notFound();
  }

  const { default: Post, metadata } = (await import(`@/content/blog/${slug}.mdx`)) as {
    default: React.ComponentType;
    metadata: PostMeta;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: metadata.title,
    description: metadata.description,
    image: `${SITE_URL}/opengraph-image`,
    datePublished: metadata.date,
    dateModified: metadata.date,
    author: { "@type": "Organization", name: "AutoReels", url: SITE_URL },
    publisher: { "@type": "Organization", name: "AutoReels", url: SITE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${slug}` },
  };

  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <h1>{metadata.title}</h1>
      <time className="text-sm text-muted-foreground not-prose">
        {new Date(metadata.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>
      <Post />
    </article>
  );
}
