import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/providers/transcript";
import { buildSrt } from "@/lib/srt";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// OpenAI's Whisper API rejects files over 25MB.
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip, "video-transcript", 5, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests — try again in a bit." },
      { status: 429 }
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Upload a video or audio file" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File is too large — max 25MB" }, { status: 400 });
  }

  try {
    const audio = new Uint8Array(await file.arrayBuffer());
    const transcript = await transcribeAudio({ audio });
    const srt = buildSrt(transcript.words);
    return NextResponse.json({ text: transcript.text, srt });
  } catch {
    return NextResponse.json(
      { error: "Couldn't transcribe that file — try a different one" },
      { status: 500 }
    );
  }
}
