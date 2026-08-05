import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { CaptionGeneratorForm } from "@/components/tools/caption-generator-form";

export const metadata: Metadata = {
  title: "Free Video Caption Generator | Auto Captions for TikTok & Reels",
  description:
    "Upload a video and get it back with burned-in, word-by-word captions. Free, no signup or editing software required.",
};

export default function CaptionGeneratorPage() {
  return (
    <ToolPageShell
      title="Video Caption Generator"
      description="Upload a video and get it back with burned-in, karaoke-style captions. Free, no signup required."
      about={
        <>
          <h2 className="text-base font-medium text-foreground">How it works</h2>
          <p>
            Upload any video up to 25MB. The speech is transcribed
            word-for-word, then burned directly into the video as
            karaoke-style captions that highlight each word as it&apos;s
            spoken. Takes about a minute depending on video length.
          </p>
        </>
      }
    >
      <CaptionGeneratorForm />
    </ToolPageShell>
  );
}
