import { generateText } from "ai";

const SCRIPT_MODEL = "anthropic/claude-sonnet-5";

const SYSTEM_PROMPT = `You write scripts for short-form faceless video reels (Instagram Reels, TikTok, YouTube Shorts).
Rules:
- Start with a scroll-stopping hook in the first sentence.
- Plain narration only — no scene directions, no markdown, no emojis, no speaker labels.
- 60-90 words total (about 25-35 seconds of speech).
- End with a short call to action (e.g. "Follow for more").
- Output only the narration text, nothing else.`;

export type ScriptInputType = "topic" | "script" | "url";

// A pasted "custom script" often comes straight from another AI tool
// (ChatGPT, etc.) and carries that tool's own formatting — a "Here's the
// script:" preamble, a markdown title, "**Label:**" section headers,
// emoji. None of that is narration; left in, it gets read aloud by the TTS
// voice and burned into captions as literal text. Scripts from our own
// topic/url path never have this (the system prompt above forbids it), so
// only the raw-paste path needs cleaning.
const SCRIPT_PREAMBLE = /^here'?s\s+(?:the|your|a)\s+(?:reel\s+)?script:?\s*/i;
const BULLET_PREFIX = /^[-*•]\s+/;
const MARKDOWN_HEADING = /^#{1,6}\s+/;
const LABEL_ONLY_LINE = /^([*_]{1,2})[^*_]+\1$/;
// Production-note lines ("Voice: confident, energetic", "**Music:** upbeat")
// describe how to produce the video, not what to say in it — the label
// alone (matched by LABEL_ONLY_LINE) isn't the only shape these take; the
// note is often inlined after the label on the same line, e.g.
// "**🎙️ Voice:** confident, energetic", which would otherwise survive as
// "Voice: confident, energetic" and get spoken as literal narration.
const PRODUCTION_NOTE_LINE =
  /^(?:voice|tone|style|music|sfx|visuals?|scene|caption[s]?|duration|hashtags?)\s*:/i;
const EMPHASIS_MARKERS = /[*_]{1,3}/g;
// ️ (variation selector-16) and ‍ (zero-width joiner) commonly
// trail or link emoji glyphs — stripping only the base pictographic char
// leaves an orphaned invisible character behind otherwise.
const EMOJI = /\p{Extended_Pictographic}[️‍]*/gu;

export function cleanPastedScript(text: string): string {
  const withoutPreamble = text.trim().replace(SCRIPT_PREAMBLE, "");

  const lines = withoutPreamble
    .split("\n")
    .map((line) => line.trim().replace(BULLET_PREFIX, ""))
    .filter((line) => line.length > 0)
    .filter((line) => !MARKDOWN_HEADING.test(line))
    .filter((line) => !LABEL_ONLY_LINE.test(line))
    .filter(
      (line) =>
        !PRODUCTION_NOTE_LINE.test(line.replace(EMPHASIS_MARKERS, "").replace(EMOJI, "").trim())
    );

  return lines
    .join(" ")
    .replace(EMPHASIS_MARKERS, "")
    .replace(EMOJI, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function generateScript({
  inputType,
  inputValue,
}: {
  inputType: ScriptInputType;
  inputValue: string;
}): Promise<string> {
  if (inputType === "script") {
    return cleanPastedScript(inputValue);
  }

  const prompt =
    inputType === "url"
      ? `Write a reel script about the topic implied by this URL/description: "${inputValue}". The page content could not be fetched, so infer the likely subject from the URL and write a generally useful, accurate script about that topic — do not invent specific facts, figures, or quotes attributed to the page.`
      : `Write a reel script about: "${inputValue}"`;

  const { text } = await generateText({
    model: SCRIPT_MODEL,
    system: SYSTEM_PROMPT,
    prompt,
  });

  return text.trim();
}
