"use client";

import { useState } from "react";
import { Captions, Download, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmailCapture } from "@/components/tools/email-capture";

export function CaptionGeneratorForm() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/tools/caption-generator", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }
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
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-sm text-muted-foreground hover:border-primary">
        <Upload className="size-6" />
        {file ? file.name : "Click to upload a video (max 25MB)"}
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <Button className="w-full" disabled={isLoading || !file} onClick={handleSubmit}>
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Captions className="size-4" />}
        {isLoading ? "Adding captions… (can take a minute)" : "Add captions"}
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
            render={<a href={videoUrl} download="captioned.mp4" />}
          >
            <Download className="size-4" />
            Download video
          </Button>
        </div>
      )}

      {videoUrl && <EmailCapture tool="caption-generator" />}
    </div>
  );
}
