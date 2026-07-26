import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { TranscriptForm } from "@/components/tools/transcript-form";

export const metadata: Metadata = {
  title: "Free Video Transcript Generator — Video to Text",
  description:
    "Upload a video or audio file and get an accurate text transcript, plus downloadable .txt and .srt files. Free, no signup required.",
};

export default function TranscriptPage() {
  return (
    <ToolPageShell
      title="Video Transcript Generator"
      description="Upload a video or audio file and get an accurate text transcript. Free, no signup required."
      about={
        <>
          <h2 className="text-base font-medium text-foreground">How it works</h2>
          <p>
            Upload any video or audio file up to 25MB and it&apos;s
            transcribed word-for-word using OpenAI Whisper. You get the
            plain text, plus a ready-to-use .srt subtitle file with
            correct timestamps.
          </p>
        </>
      }
    >
      <TranscriptForm />
    </ToolPageShell>
  );
}
