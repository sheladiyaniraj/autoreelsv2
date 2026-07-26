import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/providers/transcript";
import { burnCaptionsOnVideo } from "@/lib/render/burn-captions";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const maxDuration = 120;

// OpenAI's Whisper API rejects files over 25MB; this also naturally bounds
// how long the FFmpeg re-encode step takes.
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  // Tightest limit of any free tool — this is transcription plus a full
  // FFmpeg re-encode, the most expensive and slowest of the five.
  const allowed = await checkRateLimit(ip, "caption-generator", 3, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests — try again in a bit." },
      { status: 429 }
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Upload a video file" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File is too large — max 25MB" }, { status: 400 });
  }

  try {
    const video = new Uint8Array(await file.arrayBuffer());
    const transcript = await transcribeAudio({ audio: video });

    if (transcript.words.length === 0) {
      return NextResponse.json(
        { error: "Couldn't detect any speech in that file" },
        { status: 400 }
      );
    }

    const captioned = await burnCaptionsOnVideo({ video, words: transcript.words });
    return new NextResponse(new Uint8Array(captioned), {
      headers: { "Content-Type": "video/mp4" },
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't process that video — try a different one" },
      { status: 500 }
    );
  }
}
