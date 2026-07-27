"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmailCapture } from "@/components/tools/email-capture";

export function UrlDownloaderForm({
  apiEndpoint,
  placeholder,
  tool,
}: {
  apiEndpoint: string;
  placeholder: string;
  tool: string;
}) {
  const [url, setUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("video.mp4");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      if (match) setDownloadName(match[1]);

      const blob = await res.blob();
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder={placeholder}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Button className="w-full" disabled={isLoading || !url.trim()} onClick={handleSubmit}>
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        {isLoading ? "Downloading… (can take a minute)" : "Download"}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {videoUrl && (
        <div className="space-y-3">
          <Card className="overflow-hidden py-0">
            <video src={videoUrl} controls className="w-full bg-black" />
          </Card>
          <Button
            variant="outline"
            className="w-full"
            nativeButton={false}
            render={<a href={videoUrl} download={downloadName} />}
          >
            <Download className="size-4" />
            Save video
          </Button>
        </div>
      )}

      {videoUrl && <EmailCapture tool={tool} />}
    </div>
  );
}
