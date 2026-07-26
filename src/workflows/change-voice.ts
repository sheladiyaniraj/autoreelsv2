import { del } from "@vercel/blob";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ReelAspectRatio } from "@/lib/providers/visuals";
import { DEFAULT_CAPTION_STYLE, type CaptionStyle } from "@/lib/render/captions";
import { assignSceneTimings } from "@/lib/render/scenes";
import { recordReelVersion } from "@/lib/render/reel-versions";
import {
  setStage,
  stepSynthesizeVoice,
  stepTranscribe,
  stepComposeVideo,
} from "@/workflows/generate-reel";

export type ChangeVoiceInput = {
  reelId: string;
  jobId: string;
  script: string;
  aspectRatio: ReelAspectRatio;
  captionStyle?: CaptionStyle | null;
  musicUrl: string | null;
  watermark: boolean;
  voiceName: string;
  voiceProvider?: string;
  voiceId: string | null;
  oldAudioUrl: string | null;
  scenes: {
    idx: number;
    text: string;
    imageUrl: string;
    mediaType: string;
  }[];
};

async function stepFinalizeVoiceChange(
  reelId: string,
  voiceId: string | null,
  scenePlan: { text: string; startSecond: number; endSecond: number }[],
  videoUrl: string,
  thumbUrl: string,
  durationMs: number,
  audioUrl: string,
  oldAudioUrl: string | null,
  words: unknown
) {
  "use step";
  const admin = createAdminClient();

  await admin
    .from("reels")
    .update({
      video_url: videoUrl,
      thumb_url: thumbUrl,
      duration: Math.round(durationMs / 1000),
      audio_url: audioUrl,
      words_json: words,
      voice_id: voiceId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reelId);

  await Promise.all(
    scenePlan.map((scene, i) =>
      admin
        .from("scenes")
        .update({
          start_ms: Math.round(scene.startSecond * 1000),
          end_ms: Math.round(scene.endSecond * 1000),
        })
        .eq("reel_id", reelId)
        .eq("idx", i)
    )
  );

  // The previous full render is kept as version history (same as a scene
  // swap); the old voiceover itself isn't independently browsable, so it's
  // safe to delete immediately.
  await recordReelVersion(admin, reelId, videoUrl, thumbUrl, durationMs);

  if (oldAudioUrl) {
    await del(oldAudioUrl).catch((err) => {
      console.warn("Failed to clean up stale voice audio blob", err);
    });
  }
}

async function stepMarkVoiceChangeFailed(jobId: string, errorMessage: string) {
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

export async function changeVoiceWorkflow(input: ChangeVoiceInput) {
  "use workflow";

  const {
    reelId,
    jobId,
    script,
    aspectRatio,
    captionStyle,
    musicUrl,
    watermark,
    voiceName,
    voiceProvider,
    voiceId,
    oldAudioUrl,
    scenes,
  } = input;
  const resolvedCaptionStyle = captionStyle ?? DEFAULT_CAPTION_STYLE;

  try {
    await setStage(jobId, "voice");
    const { audioUrl } = await stepSynthesizeVoice(reelId, script, voiceName, voiceProvider);

    await setStage(jobId, "transcript");
    const { words, durationInSeconds } = await stepTranscribe(audioUrl);

    // Retime the *existing* scene texts against the new audio's word
    // timestamps, rather than re-deriving a fresh split from the script —
    // this keeps each scene's image mapped to the same text as before.
    const scenePlan = assignSceneTimings(
      scenes.map((s) => s.text),
      words,
      script
    );

    if (scenePlan.length !== scenes.length) {
      throw new Error(
        `New voice timing produced ${scenePlan.length} scenes instead of the original ${scenes.length} — can't safely remap scene images. Try a different voice.`
      );
    }

    await setStage(jobId, "compose");
    const { videoUrl, thumbUrl, durationMs } = await stepComposeVideo(
      reelId,
      audioUrl,
      scenes.map((s, i) => ({
        imageUrl: s.imageUrl,
        mediaType: s.mediaType,
        startSecond: scenePlan[i].startSecond,
        endSecond: scenePlan[i].endSecond,
      })),
      words,
      durationInSeconds,
      aspectRatio,
      resolvedCaptionStyle,
      musicUrl,
      watermark
    );

    await setStage(jobId, "upload");
    await stepFinalizeVoiceChange(
      reelId,
      voiceId,
      scenePlan,
      videoUrl,
      thumbUrl,
      durationMs,
      audioUrl,
      oldAudioUrl,
      words
    );

    await setStage(jobId, "done", "succeeded");

    return { reelId, status: "ready" as const };
  } catch (err) {
    await stepMarkVoiceChangeFailed(jobId, extractErrorMessage(err));
    throw err;
  }
}
