import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import type { TranscriptWord } from "@/lib/providers/transcript";
import {
  buildAssSubtitles,
  DEFAULT_CAPTION_STYLE,
  type CaptionStyle,
} from "@/lib/render/captions";
import { runFfmpeg, FONTS_DIR } from "@/lib/render/compose";

function probeResolution(videoPath: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffprobeInstaller.path, [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-print_format",
      "json",
      videoPath,
    ]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe exited with code ${code}: ${stderr.slice(-1000)}`));
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as { streams: { width: number; height: number }[] };
        const stream = parsed.streams[0];
        if (!stream) throw new Error("No video stream found");
        resolve({ width: stream.width, height: stream.height });
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to parse ffprobe output"));
      }
    });
  });
}

export async function burnCaptionsOnVideo({
  video,
  words,
  captionStyle = DEFAULT_CAPTION_STYLE,
}: {
  video: Uint8Array;
  words: TranscriptWord[];
  captionStyle?: CaptionStyle;
}): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "autoreels-captions-"));
  const inputPath = path.join(dir, "input.mp4");
  const assPath = path.join(dir, "captions.ass");
  const outputPath = path.join(dir, "output.mp4");

  try {
    await writeFile(inputPath, video);

    const { width, height } = await probeResolution(inputPath);
    await writeFile(assPath, buildAssSubtitles(words, captionStyle, { width, height }));

    const escapedAssPath = assPath.replace(/:/g, "\\:");
    const escapedFontsDir = FONTS_DIR.replace(/:/g, "\\:");
    const interFontPath = path.join(FONTS_DIR, "Inter.ttf").replace(/:/g, "\\:");
    // Free tool output — watermarked for brand exposure on shared videos.
    // Same drawtext pattern as the main pipeline's optional reel watermark.
    const watermarkFilter = `,drawtext=fontfile='${interFontPath}':text='autoreels.in':fontsize=${Math.round(width * 0.028)}:fontcolor=white@0.85:box=1:boxcolor=black@0.35:boxborderw=10:x=w-tw-20:y=20`;

    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-vf",
      `subtitles='${escapedAssPath}':fontsdir='${escapedFontsDir}'${watermarkFilter}`,
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "26",
      "-movflags",
      "+faststart",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "copy",
      outputPath,
    ]);

    return await readFile(outputPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
