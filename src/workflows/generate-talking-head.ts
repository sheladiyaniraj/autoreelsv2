import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { put } from "@vercel/blob";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TranscriptWord } from "@/lib/providers/transcript";
import type { ReelAspectRatio } from "@/lib/providers/visuals";
import { planTalkingHeadTimeline } from "@/lib/providers/talking-head-timeline";
import { reconcileTalkingHeadTimeline, type TalkingHeadSegment } from "@/lib/render/talking-head-scenes";
import { composeTalkingHeadVideo } from "@/lib/render/compose-talking-head";
import { TALKING_HEAD_PRESETS, type TalkingHeadPresetKey } from "@/lib/render/talking-head-presets";
import { runFfmpeg } from "@/lib/render/compose";
import { recordReelVersion } from "@/lib/render/reel-versions";
import {
  fetchBytes,
  setStage,
  stepTranscribe,
  stepGenerateVisual,
  stepMarkFailed,
} from "@/workflows/generate-reel";

export type GenerateTalkingHeadInput = {
  reelId: string;
  jobId: string;
  userId: string;
  sourceVideoUrl: string;
  aspectRatio: ReelAspectRatio;
  stylePreset: TalkingHeadPresetKey;
  watermark: boolean;
};

type SegmentWithVisual = TalkingHeadSegment & { imageUrl?: string; mediaType?: string };

async function markReelProcessing(reelId: string) {
  "use step";
  const admin = createAdminClient();
  await admin
    .from("reels")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", reelId);
}

async function stepExtractAudio(
  reelId: string,
  sourceVideoUrl: string
): Promise<{ audioUrl: string }> {
  "use step";
  const dir = await mkdtemp(path.join(tmpdir(), "autoreels-extract-"));
  const videoPath = path.join(dir, "source.mp4");
  const audioPath = path.join(dir, "audio.mp3");

  try {
    const video = await fetchBytes(sourceVideoUrl);
    await writeFile(videoPath, video);
    await runFfmpeg(["-y", "-i", videoPath, "-vn", "-acodec", "libmp3lame", audioPath]);
    const audio = await readFile(audioPath);

    // Versioned filename — same Blob CDN staleness reason as every other
    // stepGenerateVisual/stepComposeVideo output in generate-reel.ts.
    const blob = await put(`reels/${reelId}/th-audio-${Date.now()}.mp3`, audio, {
      access: "public",
      contentType: "audio/mpeg",
    });
    return { audioUrl: blob.url };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function stepPlanTimeline(
  words: TranscriptWord[],
  durationInSeconds: number
): Promise<TalkingHeadSegment[]> {
  "use step";
  const proposals = await planTalkingHeadTimeline({ words, durationInSeconds });
  return reconcileTalkingHeadTimeline(proposals, words, durationInSeconds);
}

async function stepComposeTalkingHead(
  reelId: string,
  sourceVideoUrl: string,
  audioUrl: string,
  segments: SegmentWithVisual[],
  words: TranscriptWord[],
  durationInSeconds: number,
  aspectRatio: ReelAspectRatio,
  stylePreset: TalkingHeadPresetKey,
  watermark: boolean
): Promise<{ videoUrl: string; thumbUrl: string; durationMs: number }> {
  "use step";
  const preset = TALKING_HEAD_PRESETS[stylePreset];

  const [sourceVideo, presenterAudio, cutawayImages] = await Promise.all([
    fetchBytes(sourceVideoUrl),
    fetchBytes(audioUrl),
    Promise.all(
      segments.map((s) => (s.type === "cutaway" && s.imageUrl ? fetchBytes(s.imageUrl) : null))
    ),
  ]);

  const composeSegments = segments.map((s, i) =>
    s.type === "presenter"
      ? { type: "presenter" as const, startSecond: s.startSecond, endSecond: s.endSecond }
      : {
          type: "cutaway" as const,
          startSecond: s.startSecond,
          endSecond: s.endSecond,
          image: cutawayImages[i]!,
          imageMediaType: s.mediaType!,
        }
  );

  const { video, thumbnail, durationMs } = await composeTalkingHeadVideo({
    sourceVideo,
    presenterAudio,
    segments: composeSegments,
    words,
    durationInSeconds,
    aspectRatio,
    captionStyle: preset.captionStyle,
    colorGrade: preset.colorGrade,
    watermark,
  });

  const version = Date.now();
  const [videoBlob, thumbBlob] = await Promise.all([
    put(`reels/${reelId}/video-${version}.mp4`, video, {
      access: "public",
      contentType: "video/mp4",
    }),
    put(`reels/${reelId}/thumb-${version}.jpg`, thumbnail, {
      access: "public",
      contentType: "image/jpeg",
    }),
  ]);

  return { videoUrl: videoBlob.url, thumbUrl: thumbBlob.url, durationMs };
}

async function stepFinalizeTalkingHead(
  reelId: string,
  sourceVideoUrl: string,
  segments: SegmentWithVisual[],
  videoUrl: string,
  thumbUrl: string,
  durationMs: number,
  audioUrl: string,
  words: TranscriptWord[]
) {
  "use step";
  const admin = createAdminClient();

  await admin
    .from("reels")
    .update({
      status: "ready",
      video_url: videoUrl,
      thumb_url: thumbUrl,
      duration: Math.round(durationMs / 1000),
      audio_url: audioUrl,
      words_json: words,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reelId);

  await recordReelVersion(admin, reelId, videoUrl, thumbUrl, durationMs);

  // Idempotency: a retry of this step should not duplicate scene rows.
  await admin.from("scenes").delete().eq("reel_id", reelId);
  await admin.from("scenes").insert(
    segments.map((seg, i) => ({
      reel_id: reelId,
      idx: i,
      text: seg.text,
      visual_url: seg.type === "presenter" ? sourceVideoUrl : seg.imageUrl,
      visual_type: seg.type === "presenter" ? "source_video" : "ai_image",
      start_ms: Math.round(seg.startSecond * 1000),
      end_ms: Math.round(seg.endSecond * 1000),
    }))
  );
}

// ---- Workflow orchestrator ----

export async function generateTalkingHeadWorkflow(input: GenerateTalkingHeadInput) {
  "use workflow";

  const { reelId, jobId, userId, sourceVideoUrl, aspectRatio, stylePreset, watermark } = input;

  try {
    await markReelProcessing(reelId);

    await setStage(jobId, "extract_audio");
    const { audioUrl } = await stepExtractAudio(reelId, sourceVideoUrl);

    await setStage(jobId, "transcript");
    const { words, durationInSeconds } = await stepTranscribe(audioUrl);

    await setStage(jobId, "timeline_plan");
    const timeline = await stepPlanTimeline(words, durationInSeconds);

    await setStage(jobId, "visuals");
    const cutawayVisuals = await Promise.all(
      timeline.map((seg, i) =>
        seg.type === "cutaway"
          ? stepGenerateVisual(reelId, i, seg.brollPrompt ?? seg.text, aspectRatio)
          : Promise.resolve(null)
      )
    );
    const segments: SegmentWithVisual[] = timeline.map((seg, i) =>
      cutawayVisuals[i]
        ? { ...seg, imageUrl: cutawayVisuals[i]!.imageUrl, mediaType: cutawayVisuals[i]!.mediaType }
        : seg
    );

    await setStage(jobId, "compose");
    const { videoUrl, thumbUrl, durationMs } = await stepComposeTalkingHead(
      reelId,
      sourceVideoUrl,
      audioUrl,
      segments,
      words,
      durationInSeconds,
      aspectRatio,
      stylePreset,
      watermark
    );

    await setStage(jobId, "upload");
    await stepFinalizeTalkingHead(
      reelId,
      sourceVideoUrl,
      segments,
      videoUrl,
      thumbUrl,
      durationMs,
      audioUrl,
      words
    );

    await setStage(jobId, "done", "succeeded");

    return { reelId, status: "ready" as const };
  } catch (err) {
    await stepMarkFailed(jobId, reelId, userId, extractErrorMessage(err), "talking_head_generation_failed");
    throw err;
  }
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
