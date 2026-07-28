import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { start } from "workflow/api";
import { track } from "@vercel/analytics/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ReelAspectRatio } from "@/lib/providers/visuals";
import { probeVideoMetadata } from "@/lib/render/probe";
import {
  DEFAULT_TALKING_HEAD_PRESET,
  TALKING_HEAD_PRESETS,
  type TalkingHeadPresetKey,
} from "@/lib/render/talking-head-presets";
import { generateTalkingHeadWorkflow } from "@/workflows/generate-talking-head";

export const maxDuration = 90;

// 90MB / 3min caps, confirmed with the user during planning — generous
// enough for a real talking-head clip while keeping the ffprobe-gate +
// Blob-upload step (the only synchronous work on this route; the actual
// render runs off-request in the durable workflow) fast.
const MAX_FILE_SIZE = 90 * 1024 * 1024;
const MAX_DURATION_SECONDS = 180;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const aspectRatio = (formData?.get("aspectRatio") as ReelAspectRatio | null) ?? "9:16";
  const stylePresetRaw = formData?.get("stylePreset") as string | null;
  const stylePreset: TalkingHeadPresetKey =
    stylePresetRaw && stylePresetRaw in TALKING_HEAD_PRESETS
      ? (stylePresetRaw as TalkingHeadPresetKey)
      : DEFAULT_TALKING_HEAD_PRESET;

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Upload a video file" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File is too large — max 90MB" }, { status: 400 });
  }

  const video = new Uint8Array(await file.arrayBuffer());

  // Validate with ffprobe BEFORE any DB write or credit deduction — a
  // rejected upload should leave no trace in reels/credit_ledger.
  const dir = await mkdtemp(path.join(tmpdir(), "autoreels-th-upload-"));
  const probePath = path.join(dir, "upload.mp4");
  let metadata: { width: number; height: number; durationSeconds: number };
  try {
    await writeFile(probePath, video);
    metadata = await probeVideoMetadata(probePath);
  } catch {
    return NextResponse.json({ error: "Couldn't read that video file" }, { status: 400 });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }

  if (metadata.durationSeconds > MAX_DURATION_SECONDS) {
    return NextResponse.json(
      { error: "Video is too long — max 3 minutes" },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();

  const blob = await put(
    `reels/talking-head-source-${user.id}-${Date.now()}.mp4`,
    Buffer.from(video),
    { access: "public", contentType: file.type || "video/mp4" }
  );

  const admin = createAdminClient();

  const { data: reel, error: reelError } = await admin
    .from("reels")
    .insert({
      user_id: user.id,
      title: file.name.replace(/\.[^.]+$/, "").slice(0, 60) || "Talking-head reel",
      status: "queued",
      input_type: "talking_head",
      aspect_ratio: aspectRatio,
      source_video_url: blob.url,
      style_preset: stylePreset,
    })
    .select("id")
    .single();

  if (reelError || !reel) {
    return NextResponse.json({ error: "Could not create reel" }, { status: 500 });
  }

  const { data: newBalance } = await admin.rpc("deduct_credit", {
    p_user_id: user.id,
    p_reason: "talking_head_generation",
    p_ref_id: reel.id,
  });

  if (newBalance === null) {
    await admin.from("reels").update({ status: "failed" }).eq("id", reel.id);
    return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
  }

  const { data: job, error: jobError } = await admin
    .from("render_jobs")
    .insert({ reel_id: reel.id, stage: "extract_audio", status: "queued" })
    .select("id")
    .single();

  if (jobError || !job) {
    await admin.rpc("refund_credit", {
      p_user_id: user.id,
      p_reason: "talking_head_generation_failed",
      p_ref_id: reel.id,
    });
    await admin.from("reels").update({ status: "failed" }).eq("id", reel.id);
    return NextResponse.json({ error: "Could not queue render job" }, { status: 500 });
  }

  const run = await start(generateTalkingHeadWorkflow, [
    {
      reelId: reel.id,
      jobId: job.id,
      userId: user.id,
      sourceVideoUrl: blob.url,
      aspectRatio,
      stylePreset,
      watermark: (profile?.plan ?? "free") === "free",
    },
  ]);

  await admin.from("render_jobs").update({ run_id: run.runId }).eq("id", job.id);

  await track("talking_head_generation_started", { aspectRatio, stylePreset });

  return NextResponse.json({ reelId: reel.id, jobId: job.id });
}
