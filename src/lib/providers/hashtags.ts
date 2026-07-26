import { generateObject } from "ai";
import { z } from "zod";

const HASHTAG_MODEL = "anthropic/claude-sonnet-5";

const HashtagSchema = z.object({
  hashtags: z
    .array(z.string())
    .describe("8-12 relevant short-form-video hashtags, without the # symbol"),
});

export async function generateHashtags({ script }: { script: string }): Promise<string[]> {
  const { object } = await generateObject({
    model: HASHTAG_MODEL,
    schema: HashtagSchema,
    prompt: `Generate 8-12 relevant, high-reach hashtags for this short-form video script (Instagram Reels / TikTok / YouTube Shorts). Mix broad discovery tags with a couple of niche-specific ones. Return each hashtag without the "#" symbol, lowercase, no spaces.\n\nScript: "${script}"`,
  });

  return object.hashtags.map((tag) => tag.replace(/^#/, "").trim()).filter(Boolean);
}
