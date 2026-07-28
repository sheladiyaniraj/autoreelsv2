import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reelId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: reel } = await supabase
    .from("reels")
    .select("id, video_url, thumb_url, audio_url, source_video_url")
    .eq("id", reelId)
    .eq("user_id", user.id)
    .single();

  if (!reel) {
    return NextResponse.json({ error: "Reel not found" }, { status: 404 });
  }

  const [{ data: scenes }, { data: versions }] = await Promise.all([
    supabase.from("scenes").select("visual_url").eq("reel_id", reelId),
    supabase.from("reel_versions").select("video_url, thumb_url").eq("reel_id", reelId),
  ]);

  // RLS scopes this to the caller's own reel; scenes, render_jobs, and
  // reel_versions cascade-delete along with it.
  const { error: deleteError } = await supabase
    .from("reels")
    .delete()
    .eq("id", reelId);

  if (deleteError) {
    return NextResponse.json({ error: "Could not delete reel" }, { status: 500 });
  }

  const blobUrls = [
    ...new Set(
      [
        reel.video_url,
        reel.thumb_url,
        reel.audio_url,
        reel.source_video_url,
        ...(scenes?.map((s) => s.visual_url) ?? []),
        ...(versions?.flatMap((v) => [v.video_url, v.thumb_url]) ?? []),
      ].filter((url): url is string => Boolean(url))
    ),
  ];

  if (blobUrls.length > 0) {
    await del(blobUrls).catch((err) => {
      console.warn("Failed to clean up blobs for deleted reel", err);
    });
  }

  return NextResponse.json({ ok: true });
}
