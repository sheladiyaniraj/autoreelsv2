import Link from "next/link";
import type { Metadata } from "next";
import { BLOG_SLUGS } from "@/content/blog/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides on AI voiceover, faceless reels, and short-form video creation.",
};

type PostMeta = { title: string; description: string; date: string };

async function loadPosts() {
  const posts = await Promise.all(
    BLOG_SLUGS.map(async (slug) => {
      const mod = (await import(`@/content/blog/${slug}.mdx`)) as { metadata: PostMeta };
      return { slug, ...mod.metadata };
    })
  );
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export default async function BlogIndexPage() {
  const posts = await loadPosts();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Blog</h1>
        <p className="text-muted-foreground">
          Guides on AI voiceover, faceless reels, and short-form video creation.
        </p>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
            <h2 className="text-xl font-medium group-hover:underline">{post.title}</h2>
            <p className="text-sm text-muted-foreground">{post.description}</p>
            <time className="text-xs text-muted-foreground">
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </Link>
        ))}
      </div>
    </div>
  );
}
