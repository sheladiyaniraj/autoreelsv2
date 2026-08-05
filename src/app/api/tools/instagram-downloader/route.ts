import { NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";
import { downloadMedia } from "@/lib/downloaders/yt-dlp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const maxDuration = 120;

const INSTAGRAM_URL_PATTERN = /^https?:\/\/(www\.)?instagram\.com\//i;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip, "instagram-downloader", 5, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests, try again in a bit." },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { url?: string };
  const url = body.url?.trim();

  if (!url || !INSTAGRAM_URL_PATTERN.test(url)) {
    return NextResponse.json({ error: "Enter a valid Instagram URL" }, { status: 400 });
  }

  try {
    const { video, title } = await downloadMedia(url);
    const filename = `${title.replace(/[^a-z0-9]+/gi, "-").slice(0, 60) || "reel"}.mp4`;
    await track("tool_used", { tool: "instagram-downloader" });
    return new NextResponse(new Uint8Array(video), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("instagram-downloader failed:", err);
    return NextResponse.json(
      { error: "Couldn't download that reel, it may be private or unavailable" },
      { status: 500 }
    );
  }
}
