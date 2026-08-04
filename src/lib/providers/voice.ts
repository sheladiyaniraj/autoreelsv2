import { elevenlabs } from "@ai-sdk/elevenlabs";
import { gateway, generateSpeech } from "ai";
import { containsDevanagari, containsGujarati } from "@/lib/script-detection";

const OPENAI_SPEECH_MODEL = "openai/tts-1";
const ELEVENLABS_SPEECH_MODEL = "eleven_flash_v2_5";
// eleven_flash_v2_5 (and every other ElevenLabs model this app could pick)
// doesn't support Gujarati at all — eleven_v3 is the only ElevenLabs model
// that does. Voice IDs are model-agnostic (a voice's timbre carries across
// models), so the existing voice mapping still applies; only the model
// needs to switch for Gujarati text.
const ELEVENLABS_GUJARATI_SPEECH_MODEL = "eleven_v3";
const SARVAM_TTS_ENDPOINT = "https://api.sarvam.ai/text-to-speech";
const SARVAM_MODEL = "bulbul:v3";

const OPENAI_VOICE_BY_NAME: Record<string, string> = {
  Aria: "nova",
  Rohan: "onyx",
  Maya: "shimmer",
  Diego: "echo",
};

// ElevenLabs premade voice IDs — pulled live from GET /v1/voices, not
// guessed from memory.
const ELEVENLABS_VOICE_BY_NAME: Record<string, string> = {
  Aria: "EXAVITQu4vr4xnSDxMaL", // Sarah — american female
  Maya: "Xb7hH8MSUJpSbSDYk0k2", // Alice — british female
  Diego: "iP95p4xoKVk53GoZ742B", // Chris — american male
};

// Sarvam's "ishita" and "shubh" are the two speakers documented as shared
// across all supported languages (English, Hindi, Gujarati, ...) rather than
// being per-language voice clones — there's no public voice-listing endpoint
// to pull a fuller set from, unlike ElevenLabs.
const SARVAM_SPEAKER_BY_NAME: Record<string, string> = {
  Aria: "ishita",
  Maya: "ishita",
  Rohan: "shubh",
  Diego: "shubh",
  Priya: "ishita",
};

// bulbul:v3's supported target_language_code values include en-IN/hi-IN/gu-IN
// (among other Indian languages) — https://docs.sarvam.ai/api-reference-docs/models/bulbul
type SarvamLanguageCode = "en-IN" | "hi-IN" | "gu-IN";

function detectSarvamLanguage(text: string): SarvamLanguageCode {
  if (containsGujarati(text)) return "gu-IN";
  if (containsDevanagari(text)) return "hi-IN";
  return "en-IN";
}

async function synthesizeWithSarvam(
  text: string,
  voiceName: string,
  languageCode: SarvamLanguageCode
): Promise<{ audio: Uint8Array; mediaType: string }> {
  const speaker = SARVAM_SPEAKER_BY_NAME[voiceName] ?? "ishita";

  const res = await fetch(SARVAM_TTS_ENDPOINT, {
    method: "POST",
    headers: {
      "api-subscription-key": process.env.SARVAM_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      target_language_code: languageCode,
      speaker,
      model: SARVAM_MODEL,
    }),
  });

  if (!res.ok) {
    throw new Error(`Sarvam TTS request failed: ${res.status} ${await res.text()}`);
  }

  const { audios } = (await res.json()) as { audios: string[] };
  return {
    audio: new Uint8Array(Buffer.from(audios[0], "base64")),
    mediaType: "audio/wav",
  };
}

export async function synthesizeVoice({
  text,
  voiceName,
  provider,
}: {
  text: string;
  voiceName: string;
  provider?: string;
}): Promise<{ audio: Uint8Array; mediaType: string }> {
  const isGujarati = containsGujarati(text);

  // OpenAI's TTS has no meaningful Gujarati support, so the default
  // (no explicit provider) path would otherwise silently produce garbled or
  // wrong-language audio. Sarvam is purpose-built for Gujarati, so it wins
  // automatically here — the same "hard capability requirement overrides
  // style preference" reasoning as the caption font override.
  if (isGujarati && provider !== "elevenlabs" && process.env.SARVAM_API_KEY) {
    return synthesizeWithSarvam(text, voiceName, "gu-IN");
  }

  // A voice explicitly backed by Sarvam (e.g. "Rohan") should actually be
  // synthesized via Sarvam regardless of language — previously this fell
  // through to the OpenAI fallback below for anything that wasn't detected
  // Gujarati, silently ignoring the user's voice choice for English/Hindi.
  if (provider === "sarvam" && process.env.SARVAM_API_KEY) {
    return synthesizeWithSarvam(text, voiceName, detectSarvamLanguage(text));
  }

  if (provider === "elevenlabs" && process.env.ELEVENLABS_API_KEY) {
    const voiceId =
      ELEVENLABS_VOICE_BY_NAME[voiceName] ?? ELEVENLABS_VOICE_BY_NAME.Aria;

    const result = await generateSpeech({
      model: elevenlabs.speech(
        isGujarati ? ELEVENLABS_GUJARATI_SPEECH_MODEL : ELEVENLABS_SPEECH_MODEL
      ),
      text,
      voice: voiceId,
    });

    return {
      audio: result.audio.uint8Array,
      mediaType: result.audio.mediaType,
    };
  }

  const voice = OPENAI_VOICE_BY_NAME[voiceName] ?? "alloy";

  const result = await generateSpeech({
    model: gateway.speech(OPENAI_SPEECH_MODEL),
    text,
    voice,
  });

  return {
    audio: result.audio.uint8Array,
    mediaType: result.audio.mediaType,
  };
}
