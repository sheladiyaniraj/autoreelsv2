import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { track } from "@vercel/analytics/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ScriptInputType } from "@/lib/providers/script";
import type { ReelAspectRatio } from "@/lib/providers/visuals";
import { IMAGE_MODELS, type ImageModelKey } from "@/lib/providers/image-models";
import { generateReelWorkflow } from "@/workflows/generate-reel";

type GenerateRequest = {
  inputType: ScriptInputType;
  inputValue: string;
  voiceId: string;
  templateId: string;
  aspectRatio: ReelAspectRatio;
  imageModel: ImageModelKey;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<GenerateRequest>;
  const inputType = body.inputType;
  const inputValue = body.inputValue?.trim();
  const aspectRatio = body.aspectRatio ?? "9:16";
  const imageModel: ImageModelKey =
    body.imageModel && body.imageModel in IMAGE_MODELS ? body.imageModel : "flux";

  if (!inputType || !inputValue) {
    return NextResponse.json({ error: "Missing input" }, { status: 400 });
  }

  const [{ data: voice }, { data: template }, { data: profile }] = await Promise.all([
    body.voiceId
      ? supabase
          .from("voices")
          .select("id, name, provider")
          .eq("id", body.voiceId)
          .single()
      : Promise.resolve({ data: null }),
    body.templateId
      ? supabase
          .from("templates")
          .select("id, name, caption_style_json, music_id")
          .eq("id", body.templateId)
          .single()
      : Promise.resolve({ data: null }),
    supabase.from("users").select("plan").eq("id", user.id).single(),
  ]);

  const admin = createAdminClient();

  const { data: reel, error: reelError } = await admin
    .from("reels")
    .insert({
      user_id: user.id,
      title: inputValue.slice(0, 60),
      status: "queued",
      input_type: inputType,
      aspect_ratio: aspectRatio,
      template_id: template?.id ?? null,
      image_model: imageModel,
      voice_id: voice?.id ?? null,
    })
    .select("id")
    .single();

  if (reelError || !reel) {
    return NextResponse.json({ error: "Could not create reel" }, { status: 500 });
  }

  const { data: newBalance } = await admin.rpc("deduct_credit", {
    p_user_id: user.id,
    p_reason: "reel_generation",
    p_ref_id: reel.id,
  });

  if (newBalance === null) {
    await admin.from("reels").update({ status: "failed" }).eq("id", reel.id);
    return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
  }

  const { data: job, error: jobError } = await admin
    .from("render_jobs")
    .insert({ reel_id: reel.id, stage: "script", status: "queued" })
    .select("id")
    .single();

  if (jobError || !job) {
    await admin.rpc("refund_credit", {
      p_user_id: user.id,
      p_reason: "reel_generation_failed",
      p_ref_id: reel.id,
    });
    await admin.from("reels").update({ status: "failed" }).eq("id", reel.id);
    return NextResponse.json({ error: "Could not queue render job" }, { status: 500 });
  }

  const run = await start(generateReelWorkflow, [
    {
      reelId: reel.id,
      jobId: job.id,
      userId: user.id,
      inputType,
      inputValue,
      voiceName: voice?.name ?? "Aria",
      voiceProvider: voice?.provider,
      aspectRatio,
      captionStyle: template?.caption_style_json ?? null,
      musicId: template?.music_id ?? null,
      watermark: (profile?.plan ?? "free") === "free",
      imageModel,
    },
  ]);

  await admin.from("render_jobs").update({ run_id: run.runId }).eq("id", job.id);

  await track("reel_generation_started", { inputType, imageModel, aspectRatio });

  return NextResponse.json({ reelId: reel.id, jobId: job.id });
}
