// Real per-unit AI provider prices, verified against the live Vercel AI
// Gateway model list and ElevenLabs' published rate (see chat history for
// the exact lookups). These are estimates for internal cost tracking, not
// a live billing reconciliation — actual spend can drift from this if
// provider pricing changes without this file being updated.

export const COST_PER_SCRIPT_USD = 0.001; // Claude Sonnet 5, ~60-90 word output + system prompt
export const COST_PER_CHAR_OPENAI_TTS = 0.000015; // openai/tts-1
export const COST_PER_CHAR_ELEVENLABS = 0.0001; // eleven_flash_v2_5, discounted API rate
export const COST_PER_SECOND_TRANSCRIPTION = 0.0001; // openai/whisper-1
export const COST_PER_IMAGE = {
  flux: 0.04, // bfl/flux-pro-1.1
  "nano-banana-2": 0.067, // google/gemini-3.1-flash-image, "default" size tier
} as const;

const AVG_CHARS_PER_WORD = 5.5;

export function estimateReelCost({
  imageModel,
  voiceProvider,
  sceneCount,
  durationSeconds,
  wordCount,
}: {
  imageModel: string | null;
  voiceProvider: string | null;
  sceneCount: number;
  durationSeconds: number | null;
  wordCount: number;
}): number {
  const charCount = wordCount * AVG_CHARS_PER_WORD;
  const voiceCostPerChar =
    voiceProvider === "elevenlabs" ? COST_PER_CHAR_ELEVENLABS : COST_PER_CHAR_OPENAI_TTS;
  const imageCostEach =
    imageModel === "nano-banana-2" ? COST_PER_IMAGE["nano-banana-2"] : COST_PER_IMAGE.flux;

  return (
    COST_PER_SCRIPT_USD +
    charCount * voiceCostPerChar +
    (durationSeconds ?? 0) * COST_PER_SECOND_TRANSCRIPTION +
    sceneCount * imageCostEach
  );
}
