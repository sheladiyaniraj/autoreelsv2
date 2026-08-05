"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IMAGE_MODELS, type ImageModelKey } from "@/lib/providers/image-models";
import { BulkItemStatus } from "@/components/bulk-item-status";

type Voice = { id: string; name: string; lang: string; gender: string | null; provider: string };
type Template = { id: string; name: string };
type AspectRatio = "9:16" | "1:1" | "16:9";

type BatchItem = {
  topic: string;
  reelId?: string;
  jobId?: string;
  error?: string;
};

const MAX_TOPICS = 20;

export function BulkCreateForm({
  voices,
  templates,
  credits,
}: {
  voices: Voice[];
  templates: Template[];
  credits: number;
}) {
  const [topicsText, setTopicsText] = useState("");
  const [voiceId, setVoiceId] = useState(voices[0]?.id ?? "");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [imageModel, setImageModel] = useState<ImageModelKey>("flux");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batch, setBatch] = useState<BatchItem[] | null>(null);

  const topics = topicsText
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, MAX_TOPICS);

  const overCap =
    topicsText.split("\n").map((t) => t.trim()).filter(Boolean).length > MAX_TOPICS;

  async function handleSubmit() {
    if (topics.length === 0) {
      toast.error("Add at least one topic");
      return;
    }

    setIsSubmitting(true);
    const items: BatchItem[] = topics.map((topic) => ({ topic }));
    setBatch([...items]);

    for (let i = 0; i < items.length; i++) {
      try {
        const res = await fetch("/api/reels/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputType: "topic",
            inputValue: items[i].topic,
            voiceId,
            templateId,
            aspectRatio,
            imageModel,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          items[i] = { ...items[i], error: data.error ?? "Failed to queue" };
          setBatch([...items]);
          if (res.status === 402) {
            // Out of credits — stop queuing the rest rather than failing
            // each remaining item one by one.
            for (let j = i + 1; j < items.length; j++) {
              items[j] = { ...items[j], error: "Skipped: out of credits" };
            }
            setBatch([...items]);
            break;
          }
          continue;
        }

        items[i] = { ...items[i], reelId: data.reelId, jobId: data.jobId };
        setBatch([...items]);
      } catch (err) {
        items[i] = {
          ...items[i],
          error: err instanceof Error ? err.message : "Failed to queue",
        };
        setBatch([...items]);
      }
    }

    setIsSubmitting(false);
  }

  if (batch) {
    const queued = batch.filter((b) => b.reelId).length;
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Queued {queued} of {batch.length} reels.
        </p>
        <Card>
          <CardContent className="divide-y p-0">
            {batch.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="truncate">{item.topic}</span>
                {item.reelId && item.jobId ? (
                  <BulkItemStatus reelId={item.reelId} jobId={item.jobId} />
                ) : item.error ? (
                  <span className="text-xs text-destructive">{item.error}</span>
                ) : (
                  <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        <Button
          variant="outline"
          onClick={() => {
            setBatch(null);
            setTopicsText("");
          }}
        >
          Start another batch
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" nativeButton={false} render={<Link href="/create" />}>
        <ArrowLeft className="size-4" />
        Back to single reel
      </Button>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Voice</Label>
              <Select value={voiceId} onValueChange={(v) => v && setVoiceId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} · {v.lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={templateId} onValueChange={(v) => v && setTemplateId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Aspect ratio</Label>
            <div className="flex gap-2">
              {(["9:16", "1:1", "16:9"] as AspectRatio[]).map((ratio) => (
                <Button
                  key={ratio}
                  type="button"
                  size="sm"
                  variant={aspectRatio === ratio ? "default" : "outline"}
                  onClick={() => setAspectRatio(ratio)}
                >
                  {ratio}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Image generation model</Label>
            <div className="flex gap-2">
              {(Object.entries(IMAGE_MODELS) as [ImageModelKey, (typeof IMAGE_MODELS)[ImageModelKey]][]).map(
                ([key, model]) => (
                  <Button
                    key={key}
                    type="button"
                    size="sm"
                    variant={imageModel === key ? "default" : "outline"}
                    onClick={() => setImageModel(key)}
                  >
                    {model.label}
                  </Button>
                )
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="topics">Topics (one per line)</Label>
              <span className="text-xs text-muted-foreground">
                {topics.length}/{MAX_TOPICS} · {credits} credits available
              </span>
            </div>
            <Textarea
              id="topics"
              rows={8}
              placeholder={
                "5 morning habits that changed my life\n3 signs you need a career change\nWhy most people fail at saving money"
              }
              value={topicsText}
              onChange={(e) => setTopicsText(e.target.value)}
            />
            {overCap && (
              <p className="text-xs text-muted-foreground">
                Only the first {MAX_TOPICS} topics will be used.
              </p>
            )}
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={isSubmitting || topics.length === 0}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Layers className="size-4" />
            )}
            {isSubmitting
              ? "Queuing…"
              : `Generate ${topics.length || ""} reel${topics.length === 1 ? "" : "s"}`.trim()}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
