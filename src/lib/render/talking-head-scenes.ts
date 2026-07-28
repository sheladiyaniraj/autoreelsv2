import type { TranscriptWord } from "@/lib/providers/transcript";
import type { TalkingHeadSegmentProposal } from "@/lib/providers/talking-head-timeline";

const MIN_CUTAWAY_SECONDS = 1.5;
const MAX_CUTAWAYS = 6;
const MAX_CUTAWAY_SHARE = 0.4; // fraction of total runtime

export type TalkingHeadSegment = {
  type: "presenter" | "cutaway";
  startSecond: number;
  endSecond: number;
  brollPrompt?: string;
  text: string;
};

type RawSegment = {
  type: "presenter" | "cutaway";
  startSecond: number;
  endSecond: number;
  brollPrompt?: string;
};

// The LLM's proposed timeline is a suggestion, not a contract — this turns
// it into something safe to render and bill against: full [0, duration]
// coverage with no gaps or overlaps, regardless of what the model returned.
export function reconcileTalkingHeadTimeline(
  proposals: TalkingHeadSegmentProposal[],
  words: TranscriptWord[],
  durationInSeconds: number
): TalkingHeadSegment[] {
  const filled = fillTimeline(proposals, durationInSeconds);
  demoteShortCutaways(filled);
  capCutaways(filled, durationInSeconds);
  const merged = mergeAdjacentPresenter(filled);
  return attachText(merged, words);
}

function fillTimeline(
  proposals: TalkingHeadSegmentProposal[],
  durationInSeconds: number
): RawSegment[] {
  const clamped = proposals
    .map((p) => ({
      type: p.type,
      startSecond: Math.max(0, Math.min(p.startSecond, durationInSeconds)),
      endSecond: Math.max(0, Math.min(p.endSecond, durationInSeconds)),
      brollPrompt: p.brollPrompt,
    }))
    .filter((p) => p.endSecond > p.startSecond)
    .sort((a, b) => a.startSecond - b.startSecond);

  const filled: RawSegment[] = [];
  let cursor = 0;

  for (const seg of clamped) {
    const start = Math.max(seg.startSecond, cursor);
    if (start >= seg.endSecond) continue; // fully consumed by a prior segment
    if (start > cursor) {
      filled.push({ type: "presenter", startSecond: cursor, endSecond: start });
    }
    filled.push({ type: seg.type, startSecond: start, endSecond: seg.endSecond, brollPrompt: seg.brollPrompt });
    cursor = seg.endSecond;
  }
  if (cursor < durationInSeconds || filled.length === 0) {
    filled.push({ type: "presenter", startSecond: cursor, endSecond: durationInSeconds });
  }
  return filled;
}

function demoteShortCutaways(segments: RawSegment[]): void {
  for (const seg of segments) {
    if (seg.type === "cutaway" && seg.endSecond - seg.startSecond < MIN_CUTAWAY_SECONDS) {
      seg.type = "presenter";
      seg.brollPrompt = undefined;
    }
  }
}

// Excess cutaways revert to presenter, evaluated in chronological order so
// one oversized segment can't claim the whole share budget before smaller
// ones downstream get a chance (a naive largest-first pass has exactly that
// failure mode). Each surviving cutaway costs one paid AI image generation,
// so these caps bound both cost and how "slideshow-like" the result can get.
function capCutaways(segments: RawSegment[], durationInSeconds: number): void {
  const cutaways = segments.filter((s) => s.type === "cutaway");
  const maxCutawaySeconds = durationInSeconds * MAX_CUTAWAY_SHARE;
  const ordered = [...cutaways].sort((a, b) => a.startSecond - b.startSecond);

  let count = 0;
  let runningSeconds = 0;
  for (const seg of ordered) {
    const dur = seg.endSecond - seg.startSecond;
    const exceedsCount = count >= MAX_CUTAWAYS;
    const exceedsShare = runningSeconds + dur > maxCutawaySeconds;
    if (exceedsCount || exceedsShare) {
      seg.type = "presenter";
      seg.brollPrompt = undefined;
      continue;
    }
    count += 1;
    runningSeconds += dur;
  }
}

function mergeAdjacentPresenter(segments: RawSegment[]): RawSegment[] {
  const merged: RawSegment[] = [];
  for (const seg of segments) {
    const prev = merged[merged.length - 1];
    if (prev && prev.type === "presenter" && seg.type === "presenter") {
      prev.endSecond = seg.endSecond;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

function attachText(segments: RawSegment[], words: TranscriptWord[]): TalkingHeadSegment[] {
  return segments.map((seg) => {
    const segWords = words.filter(
      (w) => w.startSecond >= seg.startSecond && w.startSecond < seg.endSecond
    );
    const spoken = segWords.map((w) => w.text).join(" ").trim();
    return { ...seg, text: spoken || seg.brollPrompt || "" };
  });
}
