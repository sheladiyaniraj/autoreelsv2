"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Music as MusicIcon,
  Pause,
  Play,
  Sparkles,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { playSuccessSound } from "@/lib/play-success-sound";
import { RenderProgress } from "@/components/render-progress";
import { ReviewPopup } from "@/components/review-popup";
import { IMAGE_MODELS, type ImageModelKey } from "@/lib/providers/image-models";

type Voice = {
  id: string;
  name: string;
  lang: string;
  gender: string | null;
  provider: string;
  sample_url: string | null;
};

type Template = {
  id: string;
  name: string;
  caption_style_json: Record<string, string>;
  music_id: string | null;
};

const STEPS = [
  "Input",
  "Script",
  "Voice",
  "Visuals",
  "Captions",
  "Music",
  "Format",
  "Generate",
] as const;

type InputType = "topic" | "script" | "url";
type AspectRatio = "9:16" | "1:1" | "16:9";

export function CreateWizard({
  voices,
  templates,
}: {
  voices: Voice[];
  templates: Template[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [inputType, setInputType] = useState<InputType>("topic");
  const [inputValue, setInputValue] = useState("");
  const [script, setScript] = useState("");
  const [voiceId, setVoiceId] = useState<string>(voices[0]?.id ?? "");
  const [templateId, setTemplateId] = useState<string>(templates[0]?.id ?? "");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [imageModel, setImageModel] = useState<ImageModelKey>("flux");
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [reelId, setReelId] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function togglePreview(voice: Voice) {
    if (!voice.sample_url) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (playingVoiceId === voice.id) {
      audio.pause();
      setPlayingVoiceId(null);
      return;
    }

    audio.src = voice.sample_url;
    audio.play();
    setPlayingVoiceId(voice.id);
  }

  const progress = useMemo(
    () => ((step + 1) / STEPS.length) * 100,
    [step]
  );

  const canAdvance = useMemo(() => {
    switch (STEPS[step]) {
      case "Input":
        return inputValue.trim().length > 0;
      case "Voice":
        return voiceId.length > 0;
      case "Format":
        return templateId.length > 0;
      default:
        return true;
    }
  }, [step, inputValue, voiceId, templateId]);

  async function goNext() {
    if (step === 0 && !script) {
      setIsScriptLoading(true);
      try {
        const res = await fetch("/api/reels/script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputType, inputValue }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Script generation failed");
        setScript(data.script);
      } catch (err) {
        toast.error("Couldn't draft a script", {
          description: err instanceof Error ? err.message : undefined,
        });
        return;
      } finally {
        setIsScriptLoading(false);
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/reels/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputType: "script",
          inputValue: script,
          voiceId,
          templateId,
          aspectRatio,
          imageModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setReelId(data.reelId);
      setJobId(data.jobId);
    } catch (err) {
      toast.error("Couldn't start your reel", {
        description: err instanceof Error ? err.message : undefined,
      });
      setIsGenerating(false);
    }
  }

  function handleRenderSucceeded() {
    playSuccessSound();
    toast.success("Reel ready!");
    setShowReview(true);
  }

  function goToReel() {
    setShowReview(false);
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
    setIsGenerating(false);
    setJobId(null);
    setReelId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          {STEPS.map((label, i) => (
            <button
              key={label}
              onClick={() => i <= step && setStep(i)}
              className={cn(
                "flex items-center gap-1",
                i <= step ? "text-foreground" : "cursor-default"
              )}
              disabled={i > step}
            >
              {i < step ? (
                <Check className="size-3.5 text-primary" />
              ) : (
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-full text-[10px]",
                    i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {i + 1}
                </span>
              )}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        <Progress value={progress} />
      </div>

      <Card>
        <CardContent className="min-h-90 space-y-4 pt-6">
          {STEPS[step] === "Input" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {(["topic", "script", "url"] as InputType[]).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    size="sm"
                    variant={inputType === t ? "default" : "outline"}
                    onClick={() => setInputType(t)}
                    className="capitalize"
                  >
                    {t}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="input-value">
                  {inputType === "topic" && "What's your reel about?"}
                  {inputType === "script" && "Paste your full script"}
                  {inputType === "url" && "URL to summarize"}
                </Label>
                {inputType === "url" ? (
                  <Input
                    id="input-value"
                    placeholder="https://example.com/article"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                ) : (
                  <Textarea
                    id="input-value"
                    rows={6}
                    placeholder={
                      inputType === "topic"
                        ? "e.g. 5 morning habits that changed my life"
                        : "Paste your script here..."
                    }
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                )}
              </div>
            </div>
          )}

          {STEPS[step] === "Script" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="script">Hook-first script</Label>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="size-3" />
                  AI draft
                </Badge>
              </div>
              <Textarea
                id="script"
                rows={10}
                value={script}
                onChange={(e) => setScript(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Edit line by line — this is exactly what gets voiced and
                captioned.
              </p>
            </div>
          )}

          {STEPS[step] === "Voice" && (
            <div className="space-y-3">
              <Label>Pick a voice</Label>
              {voices.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No voices seeded yet.
                </p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {voices.map((voice) => (
                  <div
                    key={voice.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setVoiceId(voice.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setVoiceId(voice.id);
                      }
                    }}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-md border p-3 text-left text-sm outline-none",
                      voiceId === voice.id
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <span>
                      <span className="font-medium">{voice.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {voice.lang} · {voice.gender ?? "neutral"} ·{" "}
                        {voice.provider}
                      </span>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!voice.sample_url}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePreview(voice);
                      }}
                    >
                      {playingVoiceId === voice.id ? (
                        <Pause className="size-3.5" />
                      ) : (
                        <Play className="size-3.5" />
                      )}
                      {playingVoiceId === voice.id ? "Playing" : "Preview"}
                    </Button>
                  </div>
                ))}
              </div>
              <audio
                ref={audioRef}
                className="hidden"
                onEnded={() => setPlayingVoiceId(null)}
              />
            </div>
          )}

          {STEPS[step] === "Visuals" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Image generation model</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(Object.entries(IMAGE_MODELS) as [ImageModelKey, (typeof IMAGE_MODELS)[ImageModelKey]][]).map(
                    ([key, model]) => (
                      <div
                        key={key}
                        role="button"
                        tabIndex={0}
                        onClick={() => setImageModel(key)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setImageModel(key);
                          }
                        }}
                        className={cn(
                          "cursor-pointer rounded-md border p-3 text-left text-sm outline-none",
                          imageModel === key
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{model.label}</span>
                          <Badge variant="secondary">{model.priceLabel}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {model.description}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <Label>Scene visuals</Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex aspect-9/16 items-center justify-center rounded-md border border-dashed bg-muted"
                    >
                      <ImageIcon className="size-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  B-roll will be auto-matched per scene using{" "}
                  {IMAGE_MODELS[imageModel].label} — you&apos;ll be able to
                  swap any clip here after generation.
                </p>
              </div>
            </div>
          )}

          {STEPS[step] === "Captions" && (
            <div className="space-y-3">
              <Label>Caption style</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplateId(t.id)}
                    className={cn(
                      "rounded-md border p-3 text-left text-sm",
                      templateId === t.id
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <Type className="mb-2 size-4 text-muted-foreground" />
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.caption_style_json?.font ?? "Default font"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {STEPS[step] === "Music" && (
            <div className="space-y-3">
              <Label>Background music</Label>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <MusicIcon className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {templates.find((t) => t.id === templateId)?.music_id ??
                      "Auto-matched to template"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Volume ducks automatically under the voiceover.
                  </p>
                </div>
              </div>
            </div>
          )}

          {STEPS[step] === "Format" && (
            <div className="space-y-4">
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
                <Label>Template</Label>
                <Select
                  value={templateId}
                  onValueChange={(value) => value && setTemplateId(value)}
                >
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
          )}

          {STEPS[step] === "Generate" && (
            <div className="space-y-4">
              <div className="rounded-md border p-4 text-sm">
                <p className="mb-2 font-medium">Summary</p>
                <dl className="grid grid-cols-2 gap-y-1 text-muted-foreground">
                  <dt>Input</dt>
                  <dd className="text-foreground capitalize">{inputType}</dd>
                  <dt>Voice</dt>
                  <dd className="text-foreground">
                    {voices.find((v) => v.id === voiceId)?.name ?? "—"}
                  </dd>
                  <dt>Template</dt>
                  <dd className="text-foreground">
                    {templates.find((t) => t.id === templateId)?.name ?? "—"}
                  </dd>
                  <dt>Image model</dt>
                  <dd className="text-foreground">
                    {IMAGE_MODELS[imageModel].label}
                  </dd>
                  <dt>Format</dt>
                  <dd className="text-foreground">{aspectRatio}</dd>
                </dl>
              </div>
              {jobId ? (
                <RenderProgress
                  jobId={jobId}
                  onSucceeded={handleRenderSucceeded}
                  onFailed={handleRenderFailed}
                />
              ) : (
                <>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    {isGenerating ? "Starting…" : "Generate reel (1 credit)"}
                  </Button>
                  {isGenerating && (
                    <p className="text-center text-xs text-muted-foreground">
                      Queuing your reel — this can take a minute once it
                      starts.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={step === 0}
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>
        {step < STEPS.length - 1 && (
          <Button onClick={goNext} disabled={!canAdvance || isScriptLoading}>
            {isScriptLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                Next
                <ChevronRight className="size-4" />
              </>
            )}
          </Button>
        )}
      </div>

      {reelId && (
        <ReviewPopup reelId={reelId} open={showReview} onDone={goToReel} />
      )}
    </div>
  );
}
