import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id: reelId, versionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: version } = await supabase
    .from("reel_versions")
    .select("video_url, thumb_url, duration")
    .eq("id", versionId)
    .eq("reel_id", reelId)
    .single();

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  // RLS (reels_update_own) scopes this to the caller's own reel.
  const { error } = await supabase
    .from("reels")
    .update({
      video_url: version.video_url,
      thumb_url: version.thumb_url,
      duration: version.duration,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reelId);

  if (error) {
    return NextResponse.json({ error: "Could not restore version" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
