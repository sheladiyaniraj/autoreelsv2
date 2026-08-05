import { NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";
import { generateHashtags } from "@/lib/providers/hashtags";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_INPUT_LENGTH = 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip, "hashtag-generator", 10, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests, try again in a bit." },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { text?: string };
  const text = body.text?.trim().slice(0, MAX_INPUT_LENGTH);

  if (!text) {
    return NextResponse.json({ error: "Enter a topic or caption first" }, { status: 400 });
  }

  try {
    const hashtags = await generateHashtags({ script: text });
    await track("tool_used", { tool: "hashtag-generator" });
    return NextResponse.json({ hashtags });
  } catch {
    return NextResponse.json({ error: "Couldn't generate hashtags, try again" }, { status: 500 });
  }
}
