"use client";

import { useState } from "react";
import { Check, Copy, Hash, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CaptionHashtags({
  reelId,
  script,
  initialHashtags,
}: {
  reelId: string;
  script: string;
  initialHashtags: string[] | null;
}) {
  const [hashtags, setHashtags] = useState<string[] | null>(initialHashtags);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState<"caption" | "hashtags" | "all" | null>(null);

  async function generate(force = false) {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/reels/${reelId}/hashtags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't generate hashtags");
      setHashtags(data.hashtags);
    } catch (err) {
      toast.error("Couldn't generate hashtags", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function copy(text: string, which: "caption" | "hashtags" | "all") {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  const hashtagLine = hashtags?.map((h) => `#${h}`).join(" ") ?? "";

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Caption</p>
          <Button variant="outline" size="sm" onClick={() => copy(script, "caption")}>
            {copied === "caption" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            Copy
          </Button>
        </div>
        <p className="text-sm whitespace-pre-wrap">{script}</p>

        <div className="flex items-center justify-between pt-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Hash className="size-3.5" />
            Hashtags
          </p>
          {hashtags && hashtags.length > 0 && (
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isGenerating}
                onClick={() => generate(true)}
              >
                {isGenerating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Regenerate
              </Button>
              <Button variant="outline" size="sm" onClick={() => copy(hashtagLine, "hashtags")}>
                {copied === "hashtags" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                Copy
              </Button>
            </div>
          )}
        </div>

        {hashtags && hashtags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {hashtags.map((tag) => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={isGenerating}
            onClick={() => generate(false)}
          >
            {isGenerating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Hash className="size-3.5" />
            )}
            {isGenerating ? "Generating…" : "Generate hashtags"}
          </Button>
        )}

        {hashtags && hashtags.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => copy(`${script}\n\n${hashtagLine}`, "all")}
          >
            {copied === "all" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            Copy caption + hashtags
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
