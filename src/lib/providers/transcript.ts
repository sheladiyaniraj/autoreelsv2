import { gateway, transcribe } from "ai";
import { containsDevanagari } from "@/lib/script-detection";

const TRANSCRIPTION_MODEL = "openai/whisper-1";

export type TranscriptWord = {
  text: string;
  startSecond: number;
  endSecond: number;
};

// Whisper auto-detects language from audio when no hint is given, and for
// lower-resource languages it can pick the wrong one entirely — verified
// transcribing real Sarvam-synthesized Gujarati audio as Devanagari
// (Hindi-looking) script rather than actual Gujarati, producing captions in
// the wrong script even though the audio and generated script were
// correctly Gujarati. Whisper's `language` param rejects "gu" outright
// (verified: "Language 'gu' is not supported." — a 400 from the API, not a
// soft fallback), so Gujarati gets no language hint at all; passing the
// known script as `prompt` alone is what was verified to fix the script
// mismatch. Hindi's "hi" *is* a valid Whisper language code, so it still
// gets the explicit hint.
function detectWhisperLanguage(text: string): string | undefined {
  if (containsDevanagari(text)) return "hi";
  return undefined;
}

export async function transcribeAudio({
  audio,
  knownScript,
}: {
  audio: Uint8Array;
  knownScript?: string;
}): Promise<{
  text: string;
  words: TranscriptWord[];
  durationInSeconds: number;
}> {
  const language = knownScript ? detectWhisperLanguage(knownScript) : undefined;

  const result = await transcribe({
    model: gateway.transcription(TRANSCRIPTION_MODEL),
    audio,
    providerOptions: {
      openai: {
        timestampGranularities: ["word"],
        ...(language ? { language } : {}),
        ...(knownScript ? { prompt: knownScript.slice(0, 800) } : {}),
      },
    },
  });

  return {
    text: result.text,
    words: result.segments.map((s) => ({
      text: s.text,
      startSecond: s.startSecond,
      endSecond: s.endSecond,
    })),
    durationInSeconds: result.durationInSeconds ?? 0,
  };
}
