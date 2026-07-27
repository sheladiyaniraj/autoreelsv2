import { NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";
import { synthesizeVoice } from "@/lib/providers/voice";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_INPUT_LENGTH = 500;
const ALLOWED_VOICES = ["Aria", "Rohan", "Maya", "Diego"] as const;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  // Tighter limit than the text-only tools — TTS costs scale with
  // characters, and this is the priciest of the free tools to abuse.
  const allowed = await checkRateLimit(ip, "ai-voiceover", 5, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests — try again in a bit." },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    text?: string;
    voiceName?: string;
  };
  const text = body.text?.trim().slice(0, MAX_INPUT_LENGTH);
  const voiceName = ALLOWED_VOICES.includes(body.voiceName as (typeof ALLOWED_VOICES)[number])
    ? (body.voiceName as (typeof ALLOWED_VOICES)[number])
    : "Aria";

  if (!text) {
    return NextResponse.json({ error: "Enter some text first" }, { status: 400 });
  }

  try {
    // Force the OpenAI path (no `provider` passed) to keep this free,
    // unauthenticated tool's per-request cost low and predictable —
    // ElevenLabs is reserved for signed-in users in the full product.
    const { audio, mediaType } = await synthesizeVoice({ text, voiceName });
    await track("tool_used", { tool: "ai-voiceover" });
    return new NextResponse(Buffer.from(audio), {
      headers: { "Content-Type": mediaType },
    });
  } catch {
    return NextResponse.json({ error: "Couldn't generate audio — try again" }, { status: 500 });
  }
}
