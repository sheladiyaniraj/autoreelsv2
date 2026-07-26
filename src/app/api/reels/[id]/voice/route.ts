import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { changeVoiceWorkflow } from "@/workflows/change-voice";
import { resolveMusicUrl } from "@/lib/render/music";
import { DEFAULT_CAPTION_STYLE, type CaptionStyle } from "@/lib/render/captions";
import type { ReelAspectRatio } from "@/lib/providers/visuals";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reelId } = await params;
  const body = (await request.json().catch(() => ({}))) as { voiceId?: string };

  if (!body.voiceId) {
    return NextResponse.json({ error: "Missing voiceId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: reel }, { data: profile }, { data: voice }] = await Promise.all([
    supabase
      .from("reels")
      .select("id, status, aspect_ratio, audio_url, template_id")
      .eq("id", reelId)
      .eq("user_id", user.id)
      .single(),
    supabase.from("users").select("plan").eq("id", user.id).single(),
    supabase.from("voices").select("id, name, provider").eq("id", body.voiceId).single(),
  ]);

  if (!reel) {
    return NextResponse.json({ error: "Reel not found" }, { status: 404 });
  }
  if (!voice) {
    return NextResponse.json({ error: "Voice not found" }, { status: 404 });
  }
  if (reel.status !== "ready") {
    return NextResponse.json(
      { error: "This reel isn't ready to edit yet" },
      { status: 400 }
    );
  }

  const { data: scenes } = await supabase
    .from("scenes")
    .select("idx, text, visual_url")
    .eq("reel_id", reelId)
    .order("idx", { ascending: true });

  if (!scenes || scenes.length === 0) {
    return NextResponse.json({ error: "This reel has no scenes yet" }, { status: 400 });
  }

  const script = scenes.map((s) => s.text ?? "").join(" ");

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
    .insert({ reel_id: reelId, stage: "voice", status: "queued" })
    .select("id")
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Could not queue voice change" }, { status: 500 });
  }

  const run = await start(changeVoiceWorkflow, [
    {
      reelId,
      jobId: job.id,
      script,
      aspectRatio: reel.aspect_ratio as ReelAspectRatio,
      captionStyle,
      musicUrl,
      watermark: (profile?.plan ?? "free") === "free",
      voiceName: voice.name,
      voiceProvider: voice.provider,
      voiceId: voice.id,
      oldAudioUrl: reel.audio_url,
      scenes: scenes.map((s) => ({
        idx: s.idx,
        text: s.text ?? "",
        imageUrl: s.visual_url ?? "",
        mediaType: s.visual_url?.endsWith(".png") ? "image/png" : "image/jpeg",
      })),
    },
  ]);

  await admin.from("render_jobs").update({ run_id: run.runId }).eq("id", job.id);

  return NextResponse.json({ jobId: job.id });
}
