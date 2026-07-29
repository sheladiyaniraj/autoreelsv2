"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, UploadCloud, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { playSuccessSound } from "@/lib/play-success-sound";
import { RenderProgress, TALKING_HEAD_STAGES } from "@/components/render-progress";
import { TALKING_HEAD_PRESETS, type TalkingHeadPresetKey } from "@/lib/render/talking-head-presets";

type AspectRatio = "9:16" | "1:1" | "16:9";

const MAX_FILE_SIZE = 90 * 1024 * 1024;

export function TalkingHeadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [stylePreset, setStylePreset] = useState<TalkingHeadPresetKey>("editorial");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [reelId, setReelId] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (selected && selected.size > MAX_FILE_SIZE) {
      toast.error("File is too large — max 90MB");
      e.target.value = "";
      return;
    }
    setFile(selected);
  }

  async function handleGenerate() {
    if (!file) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("stylePreset", stylePreset);
      formData.append("aspectRatio", aspectRatio);

      const res = await fetch("/api/talking-head/generate", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setReelId(data.reelId);
      setJobId(data.jobId);
    } catch (err) {
      toast.error("Couldn't start your edit", {
        description: err instanceof Error ? err.message : undefined,
      });
      setIsSubmitting(false);
    }
  }

  function handleRenderSucceeded() {
    playSuccessSound();
    toast.success("Reel ready!");
    router.push(`/reels/${reelId}`);
    // The header's credit badge is read in a shared server layout — a plain
    // client-side push reuses the cached layout instead of refetching it,
    // so the badge would keep showing the pre-generation balance otherwise.
    router.refresh();
  }

  function handleRenderFailed(error: string) {
    toast.error("Couldn't generate your reel", {
      description: `${error} — your credit was refunded.`,
    });
    setIsSubmitting(false);
    setJobId(null);
    setReelId(null);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        {jobId ? (
          <RenderProgress
            jobId={jobId}
            stages={TALKING_HEAD_STAGES}
            onSucceeded={handleRenderSucceeded}
            onFailed={handleRenderFailed}
          />
        ) : (
          <>
            <div className="space-y-2">
              <Label>Your footage</Label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-center outline-none",
                  file ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                {file ? (
                  <>
                    <Video className="size-6 text-primary" />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(1)}MB — click to replace
                    </p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="size-6 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload a video</p>
                    <p className="text-xs text-muted-foreground">
                      Talking-head footage, up to 3 minutes / 90MB
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="space-y-3">
              <Label>Style preset</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  Object.entries(TALKING_HEAD_PRESETS) as [
                    TalkingHeadPresetKey,
                    (typeof TALKING_HEAD_PRESETS)[TalkingHeadPresetKey],
                  ][]
                ).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStylePreset(key)}
                    className={cn(
                      "rounded-md border p-3 text-left text-sm outline-none",
                      stylePreset === key ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <p className="font-medium">{preset.label}</p>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </button>
                ))}
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

            <Button
              onClick={handleGenerate}
              disabled={!file || isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {isSubmitting ? "Starting…" : "Generate reel (1 credit)"}
            </Button>
            {isSubmitting && (
              <p className="text-center text-xs text-muted-foreground">
                Uploading and queuing your edit — this can take a minute once it
                starts.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
