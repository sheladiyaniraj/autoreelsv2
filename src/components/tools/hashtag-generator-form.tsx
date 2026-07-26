"use client";

import { useState } from "react";
import { Check, Copy, Hash, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function HashtagGeneratorForm() {
  const [text, setText] = useState("");
  const [hashtags, setHashtags] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/hashtag-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setHashtags(data.hashtags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyAll() {
    if (!hashtags) return;
    await navigator.clipboard.writeText(hashtags.map((h) => `#${h}`).join(" "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <Textarea
        rows={4}
        placeholder="e.g. 3 morning habits that changed my life"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button className="w-full" disabled={isLoading || !text.trim()} onClick={handleSubmit}>
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Hash className="size-4" />}
        {isLoading ? "Generating…" : "Generate hashtags"}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {hashtags && hashtags.length > 0 && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                </Badge>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={copyAll}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy all"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
