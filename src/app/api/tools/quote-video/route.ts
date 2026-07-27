import { NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";
import {
  buildQuoteComposition,
  QUOTE_MAX_LENGTH,
  AUTHOR_MAX_LENGTH,
} from "@/lib/hyperframes/build-quote-composition";
import { probeAudioDurationSeconds, renderQuoteVideo } from "@/lib/hyperframes/render-quote-video";
import { getQuoteStyle, QUOTE_STYLES } from "@/lib/hyperframes/quote-styles";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { synthesizeVoice } from "@/lib/providers/voice";

export const maxDuration = 300;

const VALID_STYLE_IDS = new Set(QUOTE_STYLES.map((s) => s.id));

export async function POST(request: Request) {
  const ip = getClientIp(request);
  // Headless-Chrome render is the most expensive free tool by far — keep
  // this tighter than the other tools' limits.
  const allowed = await checkRateLimit(ip, "quote-video", 3, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests — try again in a bit." },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    quote?: string;
    author?: string;
    styleId?: string;
    voiceover?: boolean;
  };

  const quote = body.quote?.trim() ?? "";
  const author = body.author?.trim() ?? "";
  const styleId = body.styleId && VALID_STYLE_IDS.has(body.styleId) ? body.styleId : QUOTE_STYLES[0].id;
  const voiceover = body.voiceover === true;

  if (!quote) {
    return NextResponse.json({ error: "Enter a quote or stat" }, { status: 400 });
  }
  if (quote.length > QUOTE_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Keep the quote under ${QUOTE_MAX_LENGTH} characters` },
      { status: 400 }
    );
  }
  if (author.length > AUTHOR_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Keep the author line under ${AUTHOR_MAX_LENGTH} characters` },
      { status: 400 }
    );
  }

  try {
    let audio: Buffer | undefined;
    let narrationDurationSeconds: number | undefined;
    if (voiceover) {
      const speech = await synthesizeVoice({
        text: author ? `${quote} — ${author}` : quote,
        voiceName: "Aria",
        provider: "elevenlabs",
      });
      audio = Buffer.from(speech.audio);
      narrationDurationSeconds = await probeAudioDurationSeconds(audio);
    }

    const html = buildQuoteComposition({
      quote,
      author,
      styleId: getQuoteStyle(styleId).id,
      narrationDurationSeconds,
      hasAudio: Boolean(audio),
    });
    const video = await renderQuoteVideo({ html, audio });
    await track("tool_used", { tool: "quote-video-maker", voiceover });
    return new NextResponse(new Uint8Array(video), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="quote-video.mp4"',
      },
    });
  } catch (err) {
    console.error("[quote-video] render failed:", err);
    return NextResponse.json(
      { error: "Couldn't render that video — try again" },
      { status: 500 }
    );
  }
}
