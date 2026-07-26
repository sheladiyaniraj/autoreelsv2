import type { TranscriptWord } from "@/lib/providers/transcript";

const MAX_SCENES = 8;
const MIN_SCENE_SECONDS = 1.5;

export type ScenePlan = {
  text: string;
  startSecond: number;
  endSecond: number;
};

function splitIntoSentences(script: string): string[] {
  const sentences = script
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.length > 0 ? sentences : [script.trim()];
}

function mergeToMaxScenes(sentences: string[]): string[] {
  if (sentences.length <= MAX_SCENES) return sentences;

  const merged: string[] = [];
  const perGroup = Math.ceil(sentences.length / MAX_SCENES);
  for (let i = 0; i < sentences.length; i += perGroup) {
    merged.push(sentences.slice(i, i + perGroup).join(" "));
  }
  return merged;
}

export function planScenes(
  script: string,
  words: TranscriptWord[]
): ScenePlan[] {
  const sceneTexts = mergeToMaxScenes(splitIntoSentences(script));
  return assignSceneTimings(sceneTexts, words, script);
}

// Splits out from planScenes so a re-voice (same script, new audio/word
// timestamps) can retime the *existing* scene texts instead of re-deriving a
// fresh split from the script — keeping the scene-to-image mapping stable.
export function assignSceneTimings(
  sceneTexts: string[],
  words: TranscriptWord[],
  fallbackText: string
): ScenePlan[] {
  if (words.length === 0) {
    // No word timestamps available — fall back to a single scene spanning
    // the whole clip so the pipeline still produces something playable.
    return [{ text: fallbackText, startSecond: 0, endSecond: 0 }];
  }

  const wordsPerScene = sceneTexts.map(
    (text) => text.split(/\s+/).filter(Boolean).length
  );
  const totalPlannedWords = wordsPerScene.reduce((a, b) => a + b, 0);

  // Scale planned word counts to match however many words whisper actually
  // returned, in case its tokenization differs slightly from ours.
  const scale = words.length / totalPlannedWords;

  const scenes: ScenePlan[] = [];
  let wordCursor = 0;

  for (let i = 0; i < sceneTexts.length; i++) {
    const isLast = i === sceneTexts.length - 1;
    const count = isLast
      ? words.length - wordCursor
      : Math.max(1, Math.round(wordsPerScene[i] * scale));

    const sliceEnd = isLast
      ? words.length
      : Math.min(words.length, wordCursor + count);
    const sliceWords = words.slice(wordCursor, sliceEnd);

    if (sliceWords.length === 0) {
      // Ran out of words (drift) — skip this scene rather than emit a
      // zero-duration clip.
      continue;
    }

    scenes.push({
      text: sceneTexts[i],
      startSecond: sliceWords[0].startSecond,
      endSecond: sliceWords[sliceWords.length - 1].endSecond,
    });

    wordCursor = sliceEnd;
  }

  return mergeShortScenes(scenes);
}

function mergeShortScenes(scenes: ScenePlan[]): ScenePlan[] {
  const merged: ScenePlan[] = [];

  for (const scene of scenes) {
    const prev = merged[merged.length - 1];
    const duration = scene.endSecond - scene.startSecond;

    if (prev && duration < MIN_SCENE_SECONDS) {
      merged[merged.length - 1] = {
        text: `${prev.text} ${scene.text}`,
        startSecond: prev.startSecond,
        endSecond: scene.endSecond,
      };
    } else {
      merged.push({ ...scene });
    }
  }

  return merged;
}
