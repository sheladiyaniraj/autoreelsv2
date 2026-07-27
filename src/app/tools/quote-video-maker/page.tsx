import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { QuoteVideoForm } from "@/components/tools/quote-video-form";

export const metadata: Metadata = {
  title: "Free Quote & Stat Video Maker",
  description:
    "Turn a quote, stat, or short headline into a short, animated vertical MP4. Free, no signup required.",
};

export default function QuoteVideoMakerPage() {
  return (
    <ToolPageShell
      title="Quote & Stat Video Maker"
      description="Paste a quote or stat, pick a style, get a short animated vertical video. Free, no signup required."
      about={
        <>
          <h2 className="text-base font-medium text-foreground">How it works</h2>
          <p>
            Paste a quote, stat, or short headline (up to 220 characters),
            optionally credit an author or source, and pick a style. Turn on
            AI voiceover to have it narrated — the video length then matches
            the narration. Renders as a 1080×1920 animated MP4 ready for
            Reels, TikTok, or Shorts.
          </p>
        </>
      }
    >
      <QuoteVideoForm />
    </ToolPageShell>
  );
}
