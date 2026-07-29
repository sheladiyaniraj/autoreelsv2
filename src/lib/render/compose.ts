import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import type { TranscriptWord } from "@/lib/providers/transcript";
import type { ReelAspectRatio } from "@/lib/providers/visuals";
import {
  buildAssSubtitles,
  DEFAULT_CAPTION_STYLE,
  type CaptionStyle,
} from "@/lib/render/captions";

const RESOLUTIONS: Record<ReelAspectRatio, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
};

export const FPS = 25;
export const FONTS_DIR = path.join(process.cwd(), "src/lib/render/fonts");
export const END_CARD_SECONDS = 5;

// Free-plan reels get a 5-second branded end card appended after the
// content — the in-frame watermark survives a crop, but a full-screen "made
// with" card is what actually drives a viewer who liked the reel back to
// autoreels.in. Built as an extra concat segment (solid color + drawtext +
// silence) shared by every pipeline that renders a `watermark` flag, rather
// than plumbed through each one's own scene/segment types.
export function buildEndCardFilter(
  startInputIndex: number,
  width: number,
  height: number
): { inputArgs: string[]; filter: string; videoLabel: string; audioLabel: string } {
  const colorInputIndex = startInputIndex;
  const silenceInputIndex = startInputIndex + 1;
  const titleFontPath = path.join(FONTS_DIR, "ArchivoBlack.ttf").replace(/:/g, "\\:");
  const subtitleFontPath = path.join(FONTS_DIR, "Inter.ttf").replace(/:/g, "\\:");
  const titleSize = Math.round(width * 0.075);
  const subtitleSize = Math.round(width * 0.032);

  const inputArgs = [
    "-f",
    "lavfi",
    "-i",
    `color=c=0x0A0A0A:s=${width}x${height}:d=${END_CARD_SECONDS}:r=${FPS}`,
    "-f",
    "lavfi",
    "-i",
    "anullsrc=r=44100:cl=stereo",
  ];

  const filter =
    `;[${colorInputIndex}:v]drawtext=fontfile='${titleFontPath}':text='Made with AutoReels':fontsize=${titleSize}:fontcolor=white:x=(w-text_w)/2:y=(h/2)-${titleSize}` +
    `,drawtext=fontfile='${subtitleFontPath}':text='autoreels.in — create yours free':fontsize=${subtitleSize}:fontcolor=white@0.85:x=(w-text_w)/2:y=(h/2)+${Math.round(titleSize * 0.35)}` +
    `,format=yuv420p[endcardv]` +
    // Explicit aformat rather than trusting the source to already be
    // 44.1kHz stereo — the concat filter requires every segment's audio to
    // share identical parameters, and TTS providers vary here.
    `;[${silenceInputIndex}:a]atrim=0:${END_CARD_SECONDS},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=stereo[endcarda]`;

  return { inputArgs, filter, videoLabel: "[endcardv]", audioLabel: "[endcarda]" };
}

export function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegInstaller.path, args);
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        if (/fontconfig|font.*not found|glyph/i.test(stderr)) {
          console.warn("ffmpeg font warning:", stderr.slice(-1000));
        }
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-2000)}`));
      }
    });
  });
}

export type ComposeScene = {
  image: Uint8Array;
  imageMediaType: string;
  startSecond: number;
  endSecond: number;
};

export async function composeVideo({
  scenes,
  audio,
  music,
  words,
  durationInSeconds,
  aspectRatio,
  captionStyle = DEFAULT_CAPTION_STYLE,
  watermark = false,
}: {
  scenes: ComposeScene[];
  audio: Uint8Array;
  music?: Uint8Array | null;
  words: TranscriptWord[];
  durationInSeconds: number;
  aspectRatio: ReelAspectRatio;
  captionStyle?: CaptionStyle;
  watermark?: boolean;
}): Promise<{ video: Buffer; thumbnail: Buffer; durationMs: number }> {
  const { width, height } = RESOLUTIONS[aspectRatio];
  const dir = await mkdtemp(path.join(tmpdir(), "autoreels-"));
  const audioPath = path.join(dir, "voice.mp3");
  const musicPath = path.join(dir, "music.mp3");
  const assPath = path.join(dir, "captions.ass");
  const videoPath = path.join(dir, "output.mp4");
  const thumbPath = path.join(dir, "thumb.jpg");

  try {
    await writeFile(audioPath, audio);
    if (music) {
      await writeFile(musicPath, music);
    }
    await writeFile(assPath, buildAssSubtitles(words, captionStyle, { width, height }));

    const escapedAssPath = assPath.replace(/:/g, "\\:");
    const escapedFontsDir = FONTS_DIR.replace(/:/g, "\\:");

    const inputArgs: string[] = [];
    const filterParts: string[] = [];
    const concatLabels: string[] = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const sceneDuration = Math.max(0.1, scene.endSecond - scene.startSecond);
      const imageExt = scene.imageMediaType.includes("png") ? "png" : "jpg";
      const imagePath = path.join(dir, `visual-${i}.${imageExt}`);
      await writeFile(imagePath, scene.image);

      inputArgs.push("-loop", "1", "-i", imagePath);

      const frames = Math.max(1, Math.round(sceneDuration * FPS));
      const label = `v${i}`;
      filterParts.push(
        `[${i}:v]scale=${width * 2}:${height * 2}:force_original_aspect_ratio=increase,` +
          `crop=${width * 2}:${height * 2},` +
          `zoompan=z='min(zoom+0.0006,1.2)':d=${frames}:s=${width}x${height}:fps=${FPS},` +
          `trim=start_frame=0:end_frame=${frames},setpts=PTS-STARTPTS,` +
          `format=yuv420p[${label}]`
      );
      concatLabels.push(`[${label}]`);
    }

    const audioInputIndex = scenes.length;
    inputArgs.push("-i", audioPath);

    let audioFilter = "";
    let audioMap: string;

    if (music) {
      const musicInputIndex = audioInputIndex + 1;
      inputArgs.push("-i", musicPath);
      // Loop the (shorter) music bed to cover the full duration, then duck
      // it under the voice via sidechain compression so it drops out
      // automatically whenever the voiceover is speaking.
      audioFilter =
        `;[${musicInputIndex}:a]aloop=loop=-1:size=2000000000,atrim=0:${durationInSeconds},asetpts=N/SR/TB,volume=0.5[musicRaw]` +
        `;[${audioInputIndex}:a]asplit=2[voiceOut][voiceSC]` +
        `;[musicRaw][voiceSC]sidechaincompress=threshold=0.015:ratio=20:attack=3:release=150:makeup=1[ducked]` +
        `;[voiceOut][ducked]amix=inputs=2:duration=first:dropout_transition=0,volume=2[aout]`;
      audioMap = "[aout]";
    } else {
      audioMap = `${audioInputIndex}:a`;
    }

    const interFontPath = path.join(FONTS_DIR, "Inter.ttf").replace(/:/g, "\\:");
    const watermarkFilter = watermark
      ? `,drawtext=fontfile='${interFontPath}':text='Made with AutoReels':fontsize=${Math.round(width * 0.028)}:fontcolor=white@0.85:box=1:boxcolor=black@0.35:boxborderw=10:x=w-tw-20:y=20`
      : "";

    // When appending an end card, the subtitle/watermark stage feeds the
    // concat below instead of terminating the graph directly.
    const subtitleOutputLabel = watermark ? "[vpre]" : "[vout]";
    let filter =
      filterParts.join(";") +
      `;${concatLabels.join("")}concat=n=${scenes.length}:v=1:a=0[vcat]` +
      `;[vcat]subtitles='${escapedAssPath}':fontsdir='${escapedFontsDir}'${watermarkFilter}${subtitleOutputLabel}` +
      audioFilter;

    let finalAudioMap = audioMap;
    let outputDuration = durationInSeconds;

    if (watermark) {
      const rawAudioPad = music ? "[aout]" : `[${audioInputIndex}:a]`;
      const nextInputIndex = audioInputIndex + (music ? 2 : 1);
      const endCard = buildEndCardFilter(nextInputIndex, width, height);
      inputArgs.push(...endCard.inputArgs);
      filter += endCard.filter;
      // Normalize before concat — the concat filter requires every segment's
      // audio to share identical parameters, and the voice/music mix's
      // actual sample rate depends on the TTS provider.
      filter += `;${rawAudioPad}aformat=sample_rates=44100:channel_layouts=stereo[mainaudio]`;
      filter += `;${subtitleOutputLabel}[mainaudio]${endCard.videoLabel}${endCard.audioLabel}concat=n=2:v=1:a=1[vout][aoutfinal]`;
      finalAudioMap = "[aoutfinal]";
      outputDuration += END_CARD_SECONDS;
    }

    await runFfmpeg([
      "-y",
      ...inputArgs,
      "-filter_complex",
      filter,
      "-map",
      "[vout]",
      "-map",
      finalAudioMap,
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
      "aac",
      "-b:a",
      "128k",
      "-t",
      String(outputDuration),
      videoPath,
    ]);

    await runFfmpeg(["-y", "-i", videoPath, "-ss", "0.5", "-frames:v", "1", thumbPath]);

    const [video, thumbnail] = await Promise.all([
      readFile(videoPath),
      readFile(thumbPath),
    ]);

    return {
      video,
      thumbnail,
      durationMs: Math.round(outputDuration * 1000),
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
