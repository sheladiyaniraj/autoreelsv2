import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clapperboard, Sparkles } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ASPECT_CLASS: Record<string, string> = {
  "9:16": "aspect-9/16",
  "1:1": "aspect-square",
  "16:9": "aspect-video",
};

async function getSharedReel(id: string) {
  const admin = createAdminClient();
  const { data: reel } = await admin
    .from("reels")
    .select("id, title, status, video_url, thumb_url, duration, aspect_ratio")
    .eq("id", id)
    .eq("status", "ready")
    .single();
  return reel;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const reel = await getSharedReel(id);

  if (!reel) {
    return { title: "Reel not found" };
  }

  const title = reel.title ?? "A reel made with AutoReels";
  const [width, height] =
    reel.aspect_ratio === "16:9" ? [1280, 720] : reel.aspect_ratio === "1:1" ? [800, 800] : [720, 1280];

  return {
    title,
    description: "Made with AutoReels — turn any topic into a faceless reel.",
    openGraph: {
      title,
      type: "video.other",
      images: reel.thumb_url ? [{ url: reel.thumb_url }] : undefined,
      videos: reel.video_url ? [{ url: reel.video_url, width, height }] : undefined,
    },
    twitter: {
      card: "player",
      title,
      images: reel.thumb_url ? [reel.thumb_url] : undefined,
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reel = await getSharedReel(id);

  if (!reel) {
    notFound();
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 py-12">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <Clapperboard className="size-5 text-primary" />
        AutoReels
      </Link>

      <Card className="w-full max-w-sm overflow-hidden py-0">
        <video
          src={reel.video_url ?? undefined}
          poster={reel.thumb_url ?? undefined}
          controls
          autoPlay
          muted
          loop
          className={cn("w-full bg-black", ASPECT_CLASS[reel.aspect_ratio] ?? "aspect-9/16")}
        />
      </Card>

      {reel.title && (
        <p className="max-w-sm text-center text-sm text-muted-foreground">{reel.title}</p>
      )}

      <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
        <Sparkles className="size-4" />
        Make your own free reel
      </Button>
    </div>
  );
}
