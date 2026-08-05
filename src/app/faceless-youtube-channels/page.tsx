import Link from "next/link";
import type { Metadata } from "next";
import { Users, Sparkles } from "lucide-react";
import { CREATORS } from "@/content/creators";
import { getChannelStats, formatSubscriberCount } from "@/lib/providers/youtube";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Faceless YouTube Channels: A Directory of AI-Generated Channels",
  description:
    "A curated directory of successful faceless and AI-generated YouTube channels, how each one works, and what it takes to build one yourself.",
};

async function loadCreators() {
  return Promise.all(
    CREATORS.map(async (creator) => {
      const stats = await getChannelStats(creator.channelId);
      return { creator, stats };
    })
  );
}

export default async function FacelessYoutubeChannelsPage() {
  const entries = await loadCreators();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Faceless YouTube Channels</h1>
        <p className="text-muted-foreground">
          A directory of successful faceless and AI-generated YouTube channels: how each one is
          made, and what it takes to build one yourself.
        </p>
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground">No channels listed yet.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map(({ creator, stats }) => (
          <Link key={creator.slug} href={`/faceless-youtube-channels/${creator.slug}`}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={stats?.thumbnailUrl ?? undefined} alt="" />
                    <AvatarFallback>{(stats?.title ?? creator.slug).slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{stats?.title ?? creator.slug}</CardTitle>
                    {stats?.subscriberCount !== undefined && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="size-3" />
                        {formatSubscriberCount(stats?.subscriberCount ?? null)} subscribers
                      </p>
                    )}
                  </div>
                </div>
                <CardDescription className="pt-2">{creator.whyItWorks}</CardDescription>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="secondary">{creator.category}</Badge>
                  {creator.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 rounded-lg border bg-muted/30 py-10 text-center">
        <h2 className="text-xl font-semibold">Want to build a channel like these?</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          AutoReels generates the script, AI voiceover, visuals, and captions for a faceless reel
          from just a topic, so you can post at the pace these channels do.
        </p>
        <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
          <Sparkles className="size-4" />
          Generate your first reel free
        </Button>
      </div>
    </div>
  );
}
