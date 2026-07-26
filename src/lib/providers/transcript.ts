import { gateway, transcribe } from "ai";

const TRANSCRIPTION_MODEL = "openai/whisper-1";

export type TranscriptWord = {
  text: string;
  startSecond: number;
  endSecond: number;
};

export async function transcribeAudio({
  audio,
}: {
  audio: Uint8Array;
}): Promise<{
  text: string;
  words: TranscriptWord[];
  durationInSeconds: number;
}> {
  const result = await transcribe({
    model: gateway.transcription(TRANSCRIPTION_MODEL),
    audio,
    providerOptions: {
      openai: {
        timestampGranularities: ["word"],
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
