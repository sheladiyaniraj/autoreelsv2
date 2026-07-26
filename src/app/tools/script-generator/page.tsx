import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ScriptGeneratorForm } from "@/components/tools/script-generator-form";

export const metadata: Metadata = {
  title: "Free AI Script & Hook Generator for TikTok, Reels & Shorts",
  description:
    "Turn a topic or article URL into a hook-first, scroll-stopping short-form video script. Free, no signup required.",
};

export default function ScriptGeneratorPage() {
  return (
    <ToolPageShell
      title="AI Script & Hook Generator"
      description="Turn a topic into a hook-first script for TikTok, Reels, or Shorts. Free, no signup required."
      about={
        <>
          <h2 className="text-base font-medium text-foreground">How it works</h2>
          <p>
            Give it a topic (or a URL to summarize) and it writes a
            60-90 word narration script: a scroll-stopping hook in the
            first sentence, the actual value in the body, and a call to
            action at the end — the same structure that drives retention
            on short-form video.
          </p>
        </>
      }
    >
      <ScriptGeneratorForm />
    </ToolPageShell>
  );
}
