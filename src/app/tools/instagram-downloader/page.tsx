import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { UrlDownloaderForm } from "@/components/tools/url-downloader-form";

export const metadata: Metadata = {
  title: "Free Instagram Reel Downloader",
  description:
    "Paste an Instagram Reel URL and download it as an MP4, no watermark added. Free, no signup required.",
};

export default function InstagramDownloaderPage() {
  return (
    <ToolPageShell
      title="Instagram Reel Downloader"
      description="Paste an Instagram Reel URL, get an MP4 download. Free, no signup required."
      about={
        <>
          <h2 className="text-base font-medium text-foreground">How it works</h2>
          <p>
            Paste a public Instagram Reel URL and it downloads as an MP4,
            capped at 1080p and 150MB. Private accounts and stories
            aren&apos;t supported.
          </p>
          <p className="rounded-md border bg-muted/30 p-3 text-xs">
            <strong className="text-foreground">Please use responsibly:</strong>{" "}
            only download reels you own, have permission to use, or are
            saving for personal reference. Respect creators&apos; rights and
            Instagram&apos;s Terms of Service. This tool is provided for
            personal, lawful use.
          </p>
        </>
      }
    >
      <UrlDownloaderForm
        apiEndpoint="/api/tools/instagram-downloader"
        placeholder="https://www.instagram.com/reel/..."
        tool="instagram-downloader"
      />
    </ToolPageShell>
  );
}
