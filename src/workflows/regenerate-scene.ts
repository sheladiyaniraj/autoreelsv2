import { del } from "@vercel/blob";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TranscriptWord } from "@/lib/providers/transcript";
import type { ReelAspectRatio } from "@/lib/providers/visuals";
import type { ImageModelKey } from "@/lib/providers/image-models";
import { DEFAULT_CAPTION_STYLE, type CaptionStyle } from "@/lib/render/captions";
import { recordReelVersion } from "@/lib/render/reel-versions";
import { setStage, stepGenerateVisual, stepComposeVideo } from "@/workflows/generate-reel";

export type RegenerateSceneInput = {
  reelId: string;
  jobId: string;
  sceneIndex: number;
  aspectRatio: ReelAspectRatio;
  captionStyle?: CaptionStyle | null;
  musicUrl: string | null;
  watermark: boolean;
  imageModel?: ImageModelKey;
  audioUrl: string;
  words: TranscriptWord[];
  durationInSeconds: number;
  scenes: {
    idx: number;
    text: string;
    imageUrl: string;
    mediaType: string;
    startSecond: number;
    endSecond: number;
  }[];
};

async function stepUpdateSceneAndReel(
  reelId: string,
  sceneIndex: number,
  oldImageUrl: string,
  newImageUrl: string,
  videoUrl: string,
  thumbUrl: string,
  durationMs: number
) {
  "use step";
  const admin = createAdminClient();

  await admin
    .from("scenes")
    .update({ visual_url: newImageUrl })
    .eq("reel_id", reelId)
    .eq("idx", sceneIndex);
  await admin
    .from("reels")
    .update({
      video_url: videoUrl,
      thumb_url: thumbUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reelId);

  // The previous full render is kept as a reel_versions row (so it can be
  // viewed/restored later) rather than deleted here — only the swapped-out
  // scene image (not versioned) is cleaned up immediately.
  await recordReelVersion(admin, reelId, videoUrl, thumbUrl, durationMs);

  await del(oldImageUrl).catch((err) => {
    console.warn("Failed to clean up stale scene image blob", err);
  });
}

async function stepMarkSceneEditFailed(jobId: string, errorMessage: string) {
  "use step";
  const admin = createAdminClient();
  await admin
    .from("render_jobs")
    .update({
      status: "failed",
      error: errorMessage.slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return typeof err === "string" ? err : "Unknown error";
}

export async function regenerateSceneWorkflow(input: RegenerateSceneInput) {
  "use workflow";

  const {
    reelId,
    jobId,
    sceneIndex,
    aspectRatio,
    captionStyle,
    musicUrl,
    watermark,
    imageModel,
    audioUrl,
    words,
    durationInSeconds,
    scenes,
  } = input;
  const resolvedCaptionStyle = captionStyle ?? DEFAULT_CAPTION_STYLE;

  try {
    await setStage(jobId, "visuals");
    const targetScene = scenes.find((s) => s.idx === sceneIndex);
    if (!targetScene) {
      throw new Error(`Scene ${sceneIndex} not found`);
    }
    const newVisual = await stepGenerateVisual(
      reelId,
      sceneIndex,
      targetScene.text,
      aspectRatio,
      imageModel
    );

    await setStage(jobId, "compose");
    const composeScenes = scenes.map((s) =>
      s.idx === sceneIndex
        ? {
            imageUrl: newVisual.imageUrl,
            mediaType: newVisual.mediaType,
            startSecond: s.startSecond,
            endSecond: s.endSecond,
          }
        : {
            imageUrl: s.imageUrl,
            mediaType: s.mediaType,
            startSecond: s.startSecond,
            endSecond: s.endSecond,
          }
    );

    const { videoUrl, thumbUrl, durationMs } = await stepComposeVideo(
      reelId,
      audioUrl,
      composeScenes,
      words,
      durationInSeconds,
      aspectRatio,
      resolvedCaptionStyle,
      musicUrl,
      watermark
    );

    await setStage(jobId, "upload");
    await stepUpdateSceneAndReel(
      reelId,
      sceneIndex,
      targetScene.imageUrl,
      newVisual.imageUrl,
      videoUrl,
      thumbUrl,
      durationMs
    );

    await setStage(jobId, "done", "succeeded");

    return { reelId, status: "ready" as const };
  } catch (err) {
    await stepMarkSceneEditFailed(jobId, extractErrorMessage(err));
    throw err;
  }
}
