import { spawn } from "node:child_process";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";

export type VideoMetadata = {
  width: number;
  height: number;
  durationSeconds: number;
};

// Same spawn pattern as burn-captions.ts's own probeResolution, extended to
// also read format.duration — kept as a separate function rather than
// modifying that one, so the working free-tool caption-generator path is
// left untouched.
export function probeVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffprobeInstaller.path, [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-show_entries",
      "format=duration",
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
        const parsed = JSON.parse(stdout) as {
          streams: { width: number; height: number }[];
          format?: { duration?: string };
        };
        const stream = parsed.streams[0];
        if (!stream) throw new Error("No video stream found");
        const durationSeconds = Number(parsed.format?.duration);
        if (!Number.isFinite(durationSeconds)) {
          throw new Error("No duration in ffprobe output");
        }
        resolve({ width: stream.width, height: stream.height, durationSeconds });
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to parse ffprobe output"));
      }
    });
  });
}
