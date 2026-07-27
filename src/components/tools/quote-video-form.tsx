"use client";

import { useState } from "react";
import { Download, Loader2, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmailCapture } from "@/components/tools/email-capture";
import { QUOTE_STYLES } from "@/lib/hyperframes/quote-styles";

export function QuoteVideoForm() {
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [styleId, setStyleId] = useState(QUOTE_STYLES[0].id);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/quote-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote, author, styleId }),
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
      <div className="flex flex-wrap gap-2">
        {QUOTE_STYLES.map((s) => (
          <Button
            key={s.id}
            type="button"
            size="sm"
            variant={styleId === s.id ? "default" : "outline"}
            onClick={() => setStyleId(s.id)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      <Textarea
        rows={3}
        placeholder="Paste a quote, stat, or short headline…"
        value={quote}
        maxLength={220}
        onChange={(e) => setQuote(e.target.value)}
      />
      <Input
        placeholder="Author or source (optional)"
        value={author}
        maxLength={60}
        onChange={(e) => setAuthor(e.target.value)}
      />

      <Button className="w-full" disabled={isLoading || !quote.trim()} onClick={handleSubmit}>
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {isLoading ? "Rendering… (can take a minute)" : "Generate video"}
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
            render={<a href={videoUrl} download="quote-video.mp4" />}
          >
            <Download className="size-4" />
            Download video
          </Button>
        </div>
      )}

      {videoUrl && <EmailCapture tool="quote-video-maker" />}
    </div>
  );
}
