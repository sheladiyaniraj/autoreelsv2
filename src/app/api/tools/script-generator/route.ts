import { NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";
import { generateScript, type ScriptInputType } from "@/lib/providers/script";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_INPUT_LENGTH = 500;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip, "script-generator", 10, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests — try again in a bit." },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    inputType?: string;
    inputValue?: string;
  };
  const inputType: ScriptInputType = body.inputType === "url" ? "url" : "topic";
  const inputValue = body.inputValue?.trim().slice(0, MAX_INPUT_LENGTH);

  if (!inputValue) {
    return NextResponse.json({ error: "Enter a topic or URL first" }, { status: 400 });
  }

  try {
    const script = await generateScript({ inputType, inputValue });
    await track("tool_used", { tool: "script-generator" });
    return NextResponse.json({ script });
  } catch {
    return NextResponse.json({ error: "Couldn't generate a script — try again" }, { status: 500 });
  }
}
