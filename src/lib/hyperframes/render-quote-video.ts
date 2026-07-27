import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import { renderCompositionInSandbox } from "@/lib/hyperframes/sandbox";

export async function probeAudioDurationSeconds(audio: Buffer): Promise<number> {
  const dir = await mkdtemp(path.join(tmpdir(), "autoreels-quote-audio-"));
  const audioPath = path.join(dir, "voice.mp3");
  try {
    await writeFile(audioPath, audio);
    return await new Promise((resolve, reject) => {
      const proc = spawn(ffprobeInstaller.path, [
        "-v", "error",
        "-show_entries", "format=duration",
        "-print_format", "json",
        audioPath,
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
          const parsed = JSON.parse(stdout) as { format?: { duration?: string } };
          const duration = Number(parsed.format?.duration);
          if (!Number.isFinite(duration)) throw new Error("No duration in ffprobe output");
          resolve(duration);
        } catch (err) {
          reject(err instanceof Error ? err : new Error("Failed to parse ffprobe output"));
        }
      });
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function renderQuoteVideo({
  html,
  audio,
}: {
  html: string;
  audio?: Buffer;
}): Promise<Buffer> {
  const extraFiles = audio ? [{ rel: "voice.mp3", content: audio }] : [];
  return renderCompositionInSandbox(html, extraFiles);
}
