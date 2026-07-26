import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { regenerateSceneWorkflow } from "@/workflows/regenerate-scene";
import { resolveMusicUrl } from "@/lib/render/music";
import { DEFAULT_CAPTION_STYLE, type CaptionStyle } from "@/lib/render/captions";
import type { TranscriptWord } from "@/lib/providers/transcript";
import type { ReelAspectRatio } from "@/lib/providers/visuals";
import type { ImageModelKey } from "@/lib/providers/image-models";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; idx: string }> }
) {
  const { id: reelId, idx } = await params;
  const sceneIndex = Number(idx);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!Number.isInteger(sceneIndex) || sceneIndex < 0) {
    return NextResponse.json({ error: "Invalid scene index" }, { status: 400 });
  }

  const [{ data: reel }, { data: profile }] = await Promise.all([
    supabase
      .from("reels")
      .select("id, status, aspect_ratio, audio_url, words_json, template_id, image_model")
      .eq("id", reelId)
      .single(),
    supabase.from("users").select("plan").eq("id", user.id).single(),
  ]);

  if (!reel) {
    return NextResponse.json({ error: "Reel not found" }, { status: 404 });
  }
  if (reel.status !== "ready" || !reel.audio_url || !reel.words_json) {
    return NextResponse.json(
      { error: "This reel isn't ready to edit yet" },
      { status: 400 }
    );
  }

  const { data: scenes } = await supabase
    .from("scenes")
    .select("idx, text, visual_url, start_ms, end_ms")
    .eq("reel_id", reelId)
    .order("idx", { ascending: true });

  if (!scenes || !scenes.some((s) => s.idx === sceneIndex)) {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }

  let captionStyle: CaptionStyle = DEFAULT_CAPTION_STYLE;
  let musicUrl: string | null = null;
  if (reel.template_id) {
    const { data: template } = await supabase
      .from("templates")
      .select("caption_style_json, music_id")
      .eq("id", reel.template_id)
      .single();
    if (template?.caption_style_json) {
      captionStyle = template.caption_style_json as CaptionStyle;
    }
    musicUrl = resolveMusicUrl(template?.music_id);
  }

  const admin = createAdminClient();
  const { data: job, error: jobError } = await admin
    .from("render_jobs")
    .insert({ reel_id: reelId, stage: "visuals", status: "queued" })
    .select("id")
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Could not queue edit" }, { status: 500 });
  }

  const maxEndMs = Math.max(...scenes.map((s) => s.end_ms ?? 0));

  const run = await start(regenerateSceneWorkflow, [
    {
      reelId,
      jobId: job.id,
      sceneIndex,
      aspectRatio: reel.aspect_ratio as ReelAspectRatio,
      captionStyle,
      musicUrl,
      watermark: (profile?.plan ?? "free") === "free",
      imageModel: (reel.image_model as ImageModelKey) ?? "flux",
      audioUrl: reel.audio_url,
      words: reel.words_json as TranscriptWord[],
      durationInSeconds: maxEndMs / 1000,
      scenes: scenes.map((s) => ({
        idx: s.idx,
        text: s.text ?? "",
        imageUrl: s.visual_url ?? "",
        mediaType: s.visual_url?.endsWith(".png") ? "image/png" : "image/jpeg",
        startSecond: (s.start_ms ?? 0) / 1000,
        endSecond: (s.end_ms ?? 0) / 1000,
      })),
    },
  ]);

  await admin.from("render_jobs").update({ run_id: run.runId }).eq("id", job.id);

  return NextResponse.json({ jobId: job.id });
}
