import { del } from "@vercel/blob";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_VERSIONS_PER_REEL = 10;

// Plain helper (no "use step") — called from inside existing step functions
// (stepFinalize, stepUpdateSceneAndReel) rather than being its own step, so
// it shares those steps' retry/durability boundary instead of adding a new
// nested one.
export async function recordReelVersion(
  admin: SupabaseClient,
  reelId: string,
  videoUrl: string,
  thumbUrl: string,
  durationMs: number
) {
  const { data: existing } = await admin
    .from("reel_versions")
    .select("id")
    .eq("reel_id", reelId)
    .eq("video_url", videoUrl)
    .maybeSingle();

  // Idempotency: a step retry re-renders to the same versioned filename, so
  // skip inserting a duplicate history row for it.
  if (!existing) {
    await admin.from("reel_versions").insert({
      reel_id: reelId,
      video_url: videoUrl,
      thumb_url: thumbUrl,
      duration: Math.round(durationMs / 1000),
    });
  }

  const { data: versions } = await admin
    .from("reel_versions")
    .select("id, video_url, thumb_url")
    .eq("reel_id", reelId)
    .order("created_at", { ascending: false });

  const excess = (versions ?? []).slice(MAX_VERSIONS_PER_REEL);
  if (excess.length > 0) {
    await admin
      .from("reel_versions")
      .delete()
      .in("id", excess.map((v) => v.id));
    await del(excess.flatMap((v) => [v.video_url, v.thumb_url])).catch((err) => {
      console.warn("Failed to clean up pruned reel versions", err);
    });
  }
}
