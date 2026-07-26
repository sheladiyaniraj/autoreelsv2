import { NextResponse } from "next/server";
import { downloadMedia } from "@/lib/downloaders/yt-dlp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const maxDuration = 120;

const YOUTUBE_URL_PATTERN = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip, "youtube-downloader", 5, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests — try again in a bit." },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { url?: string };
  const url = body.url?.trim();

  if (!url || !YOUTUBE_URL_PATTERN.test(url)) {
    return NextResponse.json({ error: "Enter a valid YouTube URL" }, { status: 400 });
  }

  try {
    const { video, title } = await downloadMedia(url);
    const filename = `${title.replace(/[^a-z0-9]+/gi, "-").slice(0, 60) || "video"}.mp4`;
    return new NextResponse(new Uint8Array(video), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't download that video — it may be private, age-restricted, or unavailable" },
      { status: 500 }
    );
  }
}
