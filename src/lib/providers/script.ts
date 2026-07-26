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

export async function generateScript({
  inputType,
  inputValue,
}: {
  inputType: ScriptInputType;
  inputValue: string;
}): Promise<string> {
  if (inputType === "script") {
    return inputValue.trim();
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
