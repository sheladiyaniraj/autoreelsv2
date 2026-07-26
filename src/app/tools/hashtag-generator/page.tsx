import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { HashtagGeneratorForm } from "@/components/tools/hashtag-generator-form";

export const metadata: Metadata = {
  title: "Free Hashtag Generator for TikTok, Reels & Shorts",
  description:
    "Paste a topic or caption and get 8-12 relevant hashtags for TikTok, Instagram Reels, or YouTube Shorts. Free, no signup required.",
};

export default function HashtagGeneratorPage() {
  return (
    <ToolPageShell
      title="Hashtag Generator"
      description="Paste a topic or caption, get relevant short-form video hashtags instantly. Free, no signup required."
      about={
        <>
          <h2 className="text-base font-medium text-foreground">How it works</h2>
          <p>
            This tool uses an AI model to read your topic or caption and
            suggest a mix of broad-discovery and niche-specific hashtags —
            the same mix a good social media manager would pick by hand. It
            works for TikTok, Instagram Reels, and YouTube Shorts captions
            alike.
          </p>
        </>
      }
    >
      <HashtagGeneratorForm />
    </ToolPageShell>
  );
}
