import { del, put } from "@vercel/blob";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateScript, type ScriptInputType } from "@/lib/providers/script";
import { synthesizeVoice } from "@/lib/providers/voice";
import { transcribeAudio, type TranscriptWord } from "@/lib/providers/transcript";
import { generateVisual, type ReelAspectRatio } from "@/lib/providers/visuals";
import type { ImageModelKey } from "@/lib/providers/image-models";
import { composeVideo } from "@/lib/render/compose";
import { assignSceneTimings, splitScriptIntoSceneTexts } from "@/lib/render/scenes";
import { DEFAULT_CAPTION_STYLE, type CaptionStyle } from "@/lib/render/captions";
import { resolveMusicUrl } from "@/lib/render/music";
import { recordReelVersion } from "@/lib/render/reel-versions";

export type GenerateReelInput = {
  reelId: string;
  jobId: string;
  userId: string;
  inputType: ScriptInputType;
  inputValue: string;
  voiceName: string;
  voiceProvider?: string;
  aspectRatio: ReelAspectRatio;
  captionStyle?: CaptionStyle | null;
  musicId?: string | null;
  watermark: boolean;
  imageModel?: ImageModelKey;
};

export async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

// ---- Stage tracking ----

export async function setStage(
  jobId: string,
  stage: string,
  status: "processing" | "succeeded" = "processing"
) {
  "use step";
  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin
    .from("render_jobs")
    .update({
      stage,
      status,
      updated_at: now,
      ...(status === "succeeded" ? { completed_at: now } : {}),
    })
    .eq("id", jobId);
}

async function markReelProcessing(reelId: string) {
  "use step";
  const admin = createAdminClient();
  await admin
    .from("reels")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", reelId);
}

// ---- Pipeline steps ----

async function stepGenerateScript(
  inputType: ScriptInputType,
  inputValue: string
): Promise<string> {
  "use step";
  return generateScript({ inputType, inputValue });
}

export async function stepSynthesizeVoice(
  reelId: string,
  script: string,
  voiceName: string,
  voiceProvider: string | undefined
): Promise<{ audioUrl: string }> {
  "use step";
  const { audio, mediaType } = await synthesizeVoice({
    text: script,
    voiceName,
    provider: voiceProvider,
  });
  // Providers don't all return the same container — Sarvam returns WAV,
  // OpenAI/ElevenLabs return MP3 — so the uploaded extension/content-type
  // must follow the actual bytes rather than assuming mp3.
  const ext = mediaType.includes("wav") ? "wav" : "mp3";
  // Versioned filename — same Blob CDN staleness reason as
  // stepGenerateVisual/stepComposeVideo: a fixed path would keep serving the
  // old audio after a voice change re-synthesizes to "the same" path.
  const blob = await put(`reels/${reelId}/voice-${Date.now()}.${ext}`, Buffer.from(audio), {
    access: "public",
    contentType: mediaType,
  });
  return { audioUrl: blob.url };
}

export async function stepTranscribe(
  audioUrl: string,
  knownScript?: string
): Promise<{
  words: TranscriptWord[];
  durationInSeconds: number;
}> {
  "use step";
  const audio = await fetchBytes(audioUrl);
  const transcript = await transcribeAudio({ audio, knownScript });
  return { words: transcript.words, durationInSeconds: transcript.durationInSeconds };
}

export async function stepGenerateVisual(
  reelId: string,
  sceneIndex: number,
  sceneText: string,
  aspectRatio: ReelAspectRatio,
  imageModel?: ImageModelKey
): Promise<{ imageUrl: string; mediaType: string }> {
  "use step";
  const { image, mediaType } = await generateVisual({
    topic: sceneText,
    aspectRatio,
    model: imageModel,
  });
  const ext = mediaType.includes("png") ? "png" : "jpg";
  // Versioned filename: Blob's CDN caches by pathname for 30 days, and an
  // in-place overwrite doesn't invalidate that cache, so a scene "swap"
  // would otherwise keep serving the stale image.
  const blob = await put(
    `reels/${reelId}/scene-${sceneIndex}-${Date.now()}.${ext}`,
    Buffer.from(image),
    { access: "public", contentType: mediaType }
  );
  return { imageUrl: blob.url, mediaType };
}

export async function stepComposeVideo(
  reelId: string,
  audioUrl: string,
  scenes: { imageUrl: string; mediaType: string; startSecond: number; endSecond: number }[],
  words: TranscriptWord[],
  durationInSeconds: number,
  aspectRatio: ReelAspectRatio,
  captionStyle: CaptionStyle,
  musicUrl: string | null,
  watermark: boolean
): Promise<{ videoUrl: string; thumbUrl: string; durationMs: number }> {
  "use step";
  const [audio, sceneImages, music] = await Promise.all([
    fetchBytes(audioUrl),
    Promise.all(scenes.map((s) => fetchBytes(s.imageUrl))),
    musicUrl ? fetchBytes(musicUrl) : Promise.resolve(null),
  ]);

  const { video, thumbnail, durationMs } = await composeVideo({
    scenes: scenes.map((s, i) => ({
      image: sceneImages[i],
      imageMediaType: s.mediaType,
      startSecond: s.startSecond,
      endSecond: s.endSecond,
    })),
    audio,
    music,
    words,
    durationInSeconds,
    aspectRatio,
    captionStyle,
    watermark,
  });

  // Versioned filenames — see the note in stepGenerateVisual on why we
  // don't overwrite in place.
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

async function stepFinalize(
  reelId: string,
  scenePlan: { text: string; startSecond: number; endSecond: number }[],
  sceneUrls: { imageUrl: string }[],
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
    scenePlan.map((scene, i) => ({
      reel_id: reelId,
      idx: i,
      text: scene.text,
      visual_url: sceneUrls[i].imageUrl,
      visual_type: "ai_image",
      start_ms: Math.round(scene.startSecond * 1000),
      end_ms: Math.round(scene.endSecond * 1000),
    }))
  );
}

export async function stepMarkFailed(
  jobId: string,
  reelId: string,
  userId: string,
  errorMessage: string,
  refundReason: string = "reel_generation_failed"
) {
  "use step";
  const admin = createAdminClient();

  const now = new Date().toISOString();
  await admin
    .from("render_jobs")
    .update({
      status: "failed",
      error: errorMessage.slice(0, 500),
      updated_at: now,
      completed_at: now,
    })
    .eq("id", jobId);

  await admin.from("reels").update({ status: "failed" }).eq("id", reelId);

  // Idempotency guard: don't double-refund if this step itself retries.
  const { data: existingRefund } = await admin
    .from("credit_ledger")
    .select("id")
    .eq("ref_id", reelId)
    .eq("reason", refundReason)
    .maybeSingle();

  if (!existingRefund) {
    await admin.rpc("refund_credit", {
      p_user_id: userId,
      p_reason: refundReason,
      p_ref_id: reelId,
    });
  }
}

// Best-effort: called from a workflow's catch block with whatever blob URLs
// it uploaded before failing. Those blobs never make it into a reels/scenes/
// reel_versions row on a failure path, so nothing else ever cleans them up —
// this is what let hundreds of orphaned scene images and voice clips pile up
// in Blob storage until it hit the plan quota.
export async function stepCleanupBlobs(urls: string[]) {
  "use step";
  await del(urls).catch((err) => {
    console.warn("Failed to clean up blobs after failed workflow run", err);
  });
}

// ---- Workflow orchestrator ----

export async function generateReelWorkflow(input: GenerateReelInput) {
  "use workflow";

  const {
    reelId,
    jobId,
    userId,
    inputType,
    inputValue,
    voiceName,
    voiceProvider,
    aspectRatio,
    captionStyle,
    musicId,
    watermark,
    imageModel,
  } = input;
  const resolvedCaptionStyle = captionStyle ?? DEFAULT_CAPTION_STYLE;
  const musicUrl = resolveMusicUrl(musicId);
  // Tracks every blob this run uploads, so a failure anywhere downstream can
  // clean them up — pushed as each step *resolves*, not read off the
  // Promise.all results, since one rejecting sibling would otherwise lose
  // the URLs of scenes that already finished uploading.
  const uploadedBlobUrls: string[] = [];

  try {
    await markReelProcessing(reelId);

    await setStage(jobId, "script");
    const script = await stepGenerateScript(inputType, inputValue);

    // Scene *text* only depends on the script, not on transcript word
    // timings — so visual generation for every scene can start right away,
    // running concurrently with voice synthesis + transcription instead of
    // waiting behind them. Scene *timing* (assignSceneTimings, below) still
    // needs the transcript and only runs once both branches finish.
    const sceneTexts = splitScriptIntoSceneTexts(script);

    await setStage(jobId, "voice");
    const visualsPromise = Promise.all(
      sceneTexts.map(async (text, i) => {
        const visual = await stepGenerateVisual(reelId, i, text, aspectRatio, imageModel);
        uploadedBlobUrls.push(visual.imageUrl);
        return visual;
      })
    );

    const voicePipelinePromise = (async () => {
      const { audioUrl } = await stepSynthesizeVoice(reelId, script, voiceName, voiceProvider);
      uploadedBlobUrls.push(audioUrl);
      await setStage(jobId, "transcript");
      const { words, durationInSeconds } = await stepTranscribe(audioUrl, script);
      return { audioUrl, words, durationInSeconds };
    })();

    const [sceneVisuals, { audioUrl, words, durationInSeconds }] = await Promise.all([
      visualsPromise,
      voicePipelinePromise,
    ]);

    await setStage(jobId, "scene_plan");
    const scenePlan = assignSceneTimings(sceneTexts, words, script);
    // Merging (mergeShortScenes) can produce fewer final scenes than
    // sceneTexts/sceneVisuals — resolve each final scene's visual via
    // sourceIndex rather than assuming a 1:1 positional match.
    const resolvedSceneVisuals = scenePlan.map((scene) => sceneVisuals[scene.sourceIndex]);

    await setStage(jobId, "compose");
    const { videoUrl, thumbUrl, durationMs } = await stepComposeVideo(
      reelId,
      audioUrl,
      scenePlan.map((scene, i) => ({
        imageUrl: resolvedSceneVisuals[i].imageUrl,
        mediaType: resolvedSceneVisuals[i].mediaType,
        startSecond: scene.startSecond,
        endSecond: scene.endSecond,
      })),
      words,
      durationInSeconds,
      aspectRatio,
      resolvedCaptionStyle,
      musicUrl,
      watermark
    );
    uploadedBlobUrls.push(videoUrl, thumbUrl);

    await setStage(jobId, "upload");
    await stepFinalize(
      reelId,
      scenePlan,
      resolvedSceneVisuals,
      videoUrl,
      thumbUrl,
      durationMs,
      audioUrl,
      words
    );

    await setStage(jobId, "done", "succeeded");

    return { reelId, status: "ready" as const };
  } catch (err) {
    await stepMarkFailed(jobId, reelId, userId, extractErrorMessage(err));
    if (uploadedBlobUrls.length > 0) {
      await stepCleanupBlobs(uploadedBlobUrls);
    }
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
