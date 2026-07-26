import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { UrlDownloaderForm } from "@/components/tools/url-downloader-form";

export const metadata: Metadata = {
  title: "Free YouTube Video Downloader",
  description:
    "Paste a YouTube URL and download the video as an MP4, up to 1080p. Free, no signup required.",
};

export default function YoutubeDownloaderPage() {
  return (
    <ToolPageShell
      title="YouTube Video Downloader"
      description="Paste a YouTube URL, get an MP4 download up to 1080p. Free, no signup required."
      about={
        <>
          <h2 className="text-base font-medium text-foreground">How it works</h2>
          <p>
            Paste any public YouTube video URL and it downloads as an MP4,
            capped at 1080p and 150MB to keep things fast.
          </p>
          <p className="rounded-md border bg-muted/30 p-3 text-xs">
            <strong className="text-foreground">Please use responsibly:</strong>{" "}
            only download videos you own, have permission to use, or that
            are otherwise clearly permitted (e.g. Creative Commons, public
            domain). Respect copyright and YouTube&apos;s Terms of Service —
            this tool is provided for personal, lawful use.
          </p>
        </>
      }
    >
      <UrlDownloaderForm
        apiEndpoint="/api/tools/youtube-downloader"
        placeholder="https://www.youtube.com/watch?v=..."
      />
    </ToolPageShell>
  );
}
