import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { ReelAspectRatio } from "@/lib/providers/visuals";
import type { TranscriptWord } from "@/lib/providers/transcript";
import { buildAssSubtitles, type CaptionStyle } from "@/lib/render/captions";
import { runFfmpeg, FONTS_DIR, buildEndCardFilter, END_CARD_SECONDS } from "@/lib/render/compose";

const RESOLUTIONS: Record<ReelAspectRatio, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
};

const FPS = 25;

export type TalkingHeadComposeSegment =
  | { type: "presenter"; startSecond: number; endSecond: number }
  | {
      type: "cutaway";
      startSecond: number;
      endSecond: number;
      image: Uint8Array;
      imageMediaType: string;
    };

// Sibling to compose.ts's composeVideo(), not a branch inside it —
// composeVideo is shared by 3 existing workflows that all assume every
// scene is a still image; branching its internals for a mixed
// video-segment case risks regressing the proven pipeline for a feature
// only this workflow needs. Shares runFfmpeg/FONTS_DIR and the
// buildAssSubtitles-based caption burn-in with it.
export async function composeTalkingHeadVideo({
  sourceVideo,
  presenterAudio,
  segments,
  words,
  durationInSeconds,
  aspectRatio,
  captionStyle,
  colorGrade,
  watermark = false,
}: {
  sourceVideo: Uint8Array;
  presenterAudio: Uint8Array;
  segments: TalkingHeadComposeSegment[];
  words: TranscriptWord[];
  durationInSeconds: number;
  aspectRatio: ReelAspectRatio;
  captionStyle: CaptionStyle;
  colorGrade: string | null;
  watermark?: boolean;
}): Promise<{ video: Buffer; thumbnail: Buffer; durationMs: number }> {
  const { width, height } = RESOLUTIONS[aspectRatio];
  const dir = await mkdtemp(path.join(tmpdir(), "autoreels-th-"));
  const sourceVideoPath = path.join(dir, "source.mp4");
  const audioPath = path.join(dir, "audio.mp3");
  const assPath = path.join(dir, "captions.ass");
  const videoPath = path.join(dir, "output.mp4");
  const thumbPath = path.join(dir, "thumb.jpg");

  try {
    await writeFile(sourceVideoPath, sourceVideo);
    await writeFile(audioPath, presenterAudio);
    await writeFile(assPath, buildAssSubtitles(words, captionStyle, { width, height }));

    const escapedAssPath = assPath.replace(/:/g, "\\:");
    const escapedFontsDir = FONTS_DIR.replace(/:/g, "\\:");

    // Input 0 is always the source video (presenter segments trim from
    // it). Cutaway images are appended as they're encountered, in the
    // order ffmpeg needs to match [N:v] references built below.
    const inputArgs: string[] = ["-i", sourceVideoPath];
    const filterParts: string[] = [];
    const concatLabels: string[] = [];
    let nextInputIndex = 1;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const segDuration = Math.max(0.1, seg.endSecond - seg.startSecond);
      const label = `v${i}`;

      if (seg.type === "presenter") {
        filterParts.push(
          `[0:v]trim=start=${seg.startSecond}:end=${seg.endSecond},setpts=PTS-STARTPTS,` +
            `fps=${FPS},scale=${width}:${height}:force_original_aspect_ratio=increase,` +
            `crop=${width}:${height},format=yuv420p[${label}]`
        );
      } else {
        const imageExt = seg.imageMediaType.includes("png") ? "png" : "jpg";
        const imagePath = path.join(dir, `cutaway-${i}.${imageExt}`);
        await writeFile(imagePath, seg.image);
        const imageInputIndex = nextInputIndex++;
        inputArgs.push("-loop", "1", "-i", imagePath);

        const frames = Math.max(1, Math.round(segDuration * FPS));
        filterParts.push(
          `[${imageInputIndex}:v]scale=${width * 2}:${height * 2}:force_original_aspect_ratio=increase,` +
            `crop=${width * 2}:${height * 2},` +
            `zoompan=z='min(zoom+0.0006,1.2)':d=${frames}:s=${width}x${height}:fps=${FPS},` +
            `trim=start_frame=0:end_frame=${frames},setpts=PTS-STARTPTS,` +
            `format=yuv420p[${label}]`
        );
      }
      concatLabels.push(`[${label}]`);
    }

    const audioInputIndex = nextInputIndex;
    inputArgs.push("-i", audioPath);

    const gradeFilter = colorGrade ? `;[vcat]${colorGrade}[vgraded]` : "";
    const graded = colorGrade ? "[vgraded]" : "[vcat]";

    const interFontPath = path.join(FONTS_DIR, "Inter.ttf").replace(/:/g, "\\:");
    const watermarkFilter = watermark
      ? `,drawtext=fontfile='${interFontPath}':text='autoreels.in':fontsize=${Math.round(width * 0.028)}:fontcolor=white@0.85:box=1:boxcolor=black@0.35:boxborderw=10:x=w-tw-20:y=20`
      : "";

    // When appending an end card, the subtitle/watermark stage feeds the
    // concat below instead of terminating the graph directly.
    const subtitleOutputLabel = watermark ? "[vpre]" : "[vout]";
    let filter =
      filterParts.join(";") +
      `;${concatLabels.join("")}concat=n=${segments.length}:v=1:a=0[vcat]` +
      gradeFilter +
      `;${graded}subtitles='${escapedAssPath}':fontsdir='${escapedFontsDir}'${watermarkFilter}${subtitleOutputLabel}`;

    let finalAudioMap = `${audioInputIndex}:a`;
    let outputDuration = durationInSeconds;

    if (watermark) {
      const rawAudioPad = `[${audioInputIndex}:a]`;
      const endCard = buildEndCardFilter(audioInputIndex + 1, width, height);
      inputArgs.push(...endCard.inputArgs);
      filter += endCard.filter;
      // Normalize before concat — the concat filter requires every segment's
      // audio to share identical parameters, and the presenter audio's
      // actual sample rate depends on the source video's encoding.
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

    const [video, thumbnail] = await Promise.all([readFile(videoPath), readFile(thumbPath)]);

    return { video, thumbnail, durationMs: Math.round(outputDuration * 1000) };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
