import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Users, Sparkles, Video, Eye } from "lucide-react";
import { CREATORS, getCreator } from "@/content/creators";
import { getChannelStats, formatSubscriberCount } from "@/lib/providers/youtube";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return CREATORS.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const creator = getCreator(slug);
  if (!creator) return {};

  const stats = await getChannelStats(creator.channelId);
  const title = `${stats?.title ?? creator.slug}: Faceless YouTube Channel Breakdown`;
  const description = creator.whyItWorks;

  return {
    title,
    description,
    alternates: { canonical: `/faceless-youtube-channels/${slug}` },
    openGraph: { title, description, type: "article" },
  };
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const creator = getCreator(slug);

  if (!creator) {
    notFound();
  }

  const stats = await getChannelStats(creator.channelId);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: stats?.title ?? creator.slug,
      description: creator.whyItWorks,
    },
    url: `${SITE_URL}/faceless-youtube-channels/${slug}`,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <Button variant="ghost" nativeButton={false} render={<Link href="/faceless-youtube-channels" />}>
        <ArrowLeft className="size-4" />
        All channels
      </Button>

      <div className="my-6 flex items-center gap-4">
        <Avatar size="lg">
          <AvatarImage src={stats?.thumbnailUrl ?? undefined} alt="" />
          <AvatarFallback>{(stats?.title ?? creator.slug).slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold">{stats?.title ?? creator.slug}</h1>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="secondary">{creator.category}</Badge>
            {creator.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {stats && (
        <div className="mb-6 grid grid-cols-3 gap-3 text-center">
          <Card>
            <CardContent className="flex flex-col items-center gap-1 py-4">
              <Users className="size-4 text-muted-foreground" />
              <p className="text-lg font-semibold">
                {formatSubscriberCount(stats.subscriberCount)}
              </p>
              <p className="text-xs text-muted-foreground">Subscribers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-1 py-4">
              <Video className="size-4 text-muted-foreground" />
              <p className="text-lg font-semibold">{formatSubscriberCount(stats.videoCount)}</p>
              <p className="text-xs text-muted-foreground">Videos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-1 py-4">
              <Eye className="size-4 text-muted-foreground" />
              <p className="text-lg font-semibold">{formatSubscriberCount(stats.viewCount)}</p>
              <p className="text-xs text-muted-foreground">Total views</p>
            </CardContent>
          </Card>
        </div>
      )}

      <section className="mb-8 space-y-3">
        <h2 className="text-lg font-medium">Why this channel works</h2>
        <p className="text-sm text-muted-foreground">{creator.whyItWorks}</p>
      </section>

      <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/30 py-10 text-center">
        <h2 className="text-xl font-semibold">
          Build a channel like {stats?.title ?? "this"}
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          AutoReels generates the script, AI voiceover, visuals, and captions for a faceless reel
          from just a topic, so you can post at the pace channels like this one do.
        </p>
        <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
          <Sparkles className="size-4" />
          Generate your first reel free
        </Button>
      </div>
    </div>
  );
}
