import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SceneEditor } from "@/components/scene-editor";
import { DeleteReelButton } from "@/components/delete-reel-button";
import { VersionHistory } from "@/components/version-history";
import { CaptionHashtags } from "@/components/caption-hashtags";
import { VoiceChanger } from "@/components/voice-changer";
import { ShareButton } from "@/components/share-button";

export default async function ReelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: reel } = await supabase
    .from("reels")
    .select(
      "id, title, status, video_url, thumb_url, duration, aspect_ratio, created_at, hashtags, voice_id"
    )
    .eq("id", id)
    .single();

  if (!reel) {
    notFound();
  }

  const { data: scenes } = await supabase
    .from("scenes")
    .select("idx, text, visual_url")
    .eq("reel_id", id)
    .order("idx", { ascending: true });

  const { data: versions } = await supabase
    .from("reel_versions")
    .select("id, video_url, thumb_url, duration, created_at")
    .eq("reel_id", id)
    .order("created_at", { ascending: false });

  const { data: voices } = await supabase
    .from("voices")
    .select("id, name, lang, gender, provider")
    .order("name");

  const script = scenes?.map((s) => s.text).join(" ");

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" nativeButton={false} render={<Link href="/dashboard" />}>
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Button>
        <DeleteReelButton reelId={reel.id} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{reel.title ?? "Untitled reel"}</h1>
          <Badge variant={reel.status === "ready" ? "secondary" : "outline"} className="capitalize">
            {reel.status}
          </Badge>
        </div>
        {reel.duration && (
          <p className="text-sm text-muted-foreground">{reel.duration}s · {reel.aspect_ratio}</p>
        )}
      </div>

      {reel.status === "ready" && reel.video_url ? (
        <>
          <Card className="overflow-hidden py-0">
            <video
              src={reel.video_url}
              poster={reel.thumb_url ?? undefined}
              controls
              className="aspect-9/16 w-full bg-black"
            />
          </Card>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              nativeButton={false}
              render={<a href={reel.video_url} download />}
            >
              <Download className="size-4" />
              Download MP4
            </Button>
            <ShareButton reelId={reel.id} />
          </div>
        </>
      ) : reel.status === "processing" || reel.status === "queued" ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Still rendering — refresh in a moment.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            This reel failed to render. Your credit was refunded.
          </CardContent>
        </Card>
      )}

      {script && (
        <CaptionHashtags
          reelId={reel.id}
          script={script}
          initialHashtags={reel.hashtags}
        />
      )}

      {reel.status === "ready" && voices && voices.length > 0 && (
        <VoiceChanger reelId={reel.id} voices={voices} currentVoiceId={reel.voice_id} />
      )}

      {reel.status === "ready" && scenes && scenes.length > 0 && (
        <SceneEditor reelId={reel.id} scenes={scenes} />
      )}

      {reel.status === "ready" && versions && versions.length > 0 && (
        <VersionHistory
          reelId={reel.id}
          versions={versions}
          currentVideoUrl={reel.video_url}
        />
      )}
    </div>
  );
}
