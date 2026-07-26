import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

const YT_DLP_PATH = path.join(process.cwd(), "bin/yt-dlp");

// Caps quality/size so downloads stay fast and within Vercel's response
// size and function-duration limits — this audience wants short-form clips
// to repurpose, not archival-quality 4K masters.
const FORMAT_SELECTOR = "best[height<=1080][ext=mp4]/best[height<=1080]/best";
const MAX_FILESIZE = "150M";

// YouTube's bot-detection flags Vercel's datacenter IPs much more
// aggressively than residential ones ("Sign in to confirm you're not a
// bot"). The android player client uses a different verification path
// that's typically not subject to that same check. Harmless no-op for
// non-YouTube extractors (e.g. Instagram), so always included.
const EXTRACTOR_ARGS = ["--extractor-args", "youtube:player_client=android"];

function runYtDlp(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(YT_DLP_PATH, args);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`yt-dlp exited with code ${code}: ${stderr.slice(-2000)}`));
      }
    });
  });
}

export type MediaInfo = {
  title: string;
  thumbnail: string | null;
  durationSeconds: number | null;
};

export async function getMediaInfo(url: string): Promise<MediaInfo> {
  const { stdout } = await runYtDlp([
    ...EXTRACTOR_ARGS,
    "-j",
    "--no-warnings",
    "--skip-download",
    url,
  ]);
  const data = JSON.parse(stdout) as {
    title?: string;
    thumbnail?: string;
    duration?: number;
  };
  return {
    title: data.title ?? "video",
    thumbnail: data.thumbnail ?? null,
    durationSeconds: data.duration ?? null,
  };
}

export async function downloadMedia(
  url: string
): Promise<{ video: Buffer; title: string }> {
  const dir = await mkdtemp(path.join(tmpdir(), "autoreels-dl-"));
  const outputTemplate = path.join(dir, "video.%(ext)s");

  try {
    // --print outputs the title to stdout as part of the same invocation,
    // avoiding a second yt-dlp/network round-trip just to name the file.
    const { stdout } = await runYtDlp([
      ...EXTRACTOR_ARGS,
      "--ffmpeg-location",
      ffmpegInstaller.path,
      "-f",
      FORMAT_SELECTOR,
      "--merge-output-format",
      "mp4",
      "--max-filesize",
      MAX_FILESIZE,
      "--no-warnings",
      "--no-playlist",
      "--print",
      "after_move:%(title)s",
      "-o",
      outputTemplate,
      url,
    ]);

    const files = await readdir(dir);
    const videoFile = files.find((f) => f.startsWith("video."));
    if (!videoFile) {
      throw new Error("Download completed but no output file was found");
    }

    const video = await readFile(path.join(dir, videoFile));
    const title = stdout.trim().split("\n").pop() || "video";

    return { video, title };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
