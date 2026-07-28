import { generateObject } from "ai";
import { z } from "zod";
import type { TranscriptWord } from "@/lib/providers/transcript";

const TIMELINE_MODEL = "anthropic/claude-sonnet-5";

const SegmentSchema = z.object({
  type: z.enum(["presenter", "cutaway"]),
  startSecond: z.number(),
  endSecond: z.number(),
  brollPrompt: z
    .string()
    .optional()
    .describe(
      "Short, concrete visual description for an AI-generated B-roll image — required when type is 'cutaway', omitted otherwise."
    ),
});

const TimelineSchema = z.object({
  segments: z.array(SegmentSchema),
});

export type TalkingHeadSegmentProposal = z.infer<typeof SegmentSchema>;

// Raw LLM proposals aren't trusted as final — src/lib/render/talking-head-scenes.ts
// clamps, sorts, dedupes, and caps them before they're used for rendering or
// billing-relevant image generation.
export async function planTalkingHeadTimeline({
  words,
  durationInSeconds,
}: {
  words: TranscriptWord[];
  durationInSeconds: number;
}): Promise<TalkingHeadSegmentProposal[]> {
  const transcriptText = words.map((w) => w.text).join(" ");
  const duration = durationInSeconds.toFixed(1);

  const { object } = await generateObject({
    model: TIMELINE_MODEL,
    schema: TimelineSchema,
    prompt: `You are editing a talking-head video (a person speaking directly to camera) into a polished short-form vertical Reel/TikTok/Short. The full spoken transcript is below, spanning 0 to ${duration} seconds.

Plan a timeline of segments covering the ENTIRE duration from 0 to ${duration} seconds with no gaps and no overlaps. For each segment, choose:
- "presenter": keep showing the original speaker on camera. Use this for hooks, direct address, opinions, and any moment that benefits from eye contact and delivery.
- "cutaway": replace the visual with a full-screen B-roll image while the speaker's voice continues underneath, uninterrupted. Use this ONLY where a concrete visual would strengthen a specific point — a named thing, a number, a list item, a place, an object. When you choose "cutaway", also write a short, concrete "brollPrompt" describing an image that illustrates that exact point (a literal thing that can be photographed or illustrated, not an abstract mood).

Rules:
- Segments must be contiguous and sorted: the first starts at 0, the last ends at ${duration}, and each segment's start equals the previous segment's end.
- Keep the presenter on screen for the opening 1-2 seconds (the hook) and the final segment (the payoff/CTA).
- Prefer fewer, well-chosen cutaways over frequent ones — this should still feel like a talking-head video, not a slideshow.
- Cutaway segments should typically be 2-5 seconds long.

Transcript:
"""
${transcriptText}
"""`,
  });

  return object.segments;
}
