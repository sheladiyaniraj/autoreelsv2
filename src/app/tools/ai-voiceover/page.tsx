import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { VoiceoverForm } from "@/components/tools/voiceover-form";

export const metadata: Metadata = {
  title: "Free AI Voiceover Generator | Text to Speech for TikTok & Reels",
  description:
    "Paste text and get a natural AI voiceover MP3 for your short-form videos. Free, no signup or editing software required.",
};

export default function VoiceoverPage() {
  return (
    <ToolPageShell
      title="AI Voiceover Generator"
      description="Paste text, get a natural AI voiceover MP3, no editing software required. Free, no signup required."
      about={
        <>
          <h2 className="text-base font-medium text-foreground">How it works</h2>
          <p>
            Paste up to 500 characters of text and pick a voice. It comes
            back as a downloadable MP3 you can drop straight into your
            editor. This free tool uses OpenAI&apos;s text-to-speech voices;
            AutoReels accounts also get access to ElevenLabs&apos; more
            expressive voices for the full reel pipeline.
          </p>
        </>
      }
    >
      <VoiceoverForm />
    </ToolPageShell>
  );
}
