import { elevenlabs } from "@ai-sdk/elevenlabs";
import { gateway, generateSpeech } from "ai";

const OPENAI_SPEECH_MODEL = "openai/tts-1";
const ELEVENLABS_SPEECH_MODEL = "eleven_flash_v2_5";

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

export async function synthesizeVoice({
  text,
  voiceName,
  provider,
}: {
  text: string;
  voiceName: string;
  provider?: string;
}): Promise<{ audio: Uint8Array; mediaType: string }> {
  if (provider === "elevenlabs" && process.env.ELEVENLABS_API_KEY) {
    const voiceId =
      ELEVENLABS_VOICE_BY_NAME[voiceName] ?? ELEVENLABS_VOICE_BY_NAME.Aria;

    const result = await generateSpeech({
      model: elevenlabs.speech(ELEVENLABS_SPEECH_MODEL),
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
