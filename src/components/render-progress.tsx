"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Default sequence for the topic/script/url reel wizard — DO NOT reorder or
// insert other flows' stages here, create-wizard.tsx relies on this exact
// default (it renders RenderProgress without a `stages` prop).
const ALL_STAGES = [
  "script",
  "voice",
  "transcript",
  "scene_plan",
  "visuals",
  "compose",
  "upload",
  "done",
] as const;

export type RenderStage = (typeof ALL_STAGES)[number];

const STAGE_LABELS: Record<RenderStage, string> = {
  script: "Writing script",
  voice: "Recording voiceover",
  transcript: "Timing captions",
  scene_plan: "Planning scenes",
  visuals: "Generating visuals",
  compose: "Rendering video",
  upload: "Saving reel",
  done: "Done",
};

const POLL_INTERVAL_MS = 1200;

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function RenderProgress({
  jobId,
  stages = ALL_STAGES,
  onSucceeded,
  onFailed,
}: {
  jobId: string;
  stages?: readonly RenderStage[];
  onSucceeded: () => void;
  onFailed: (error: string) => void;
}) {
  const [stage, setStage] = useState<string>(stages[0]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const settledRef = useRef(false);

  useEffect(() => {
    settledRef.current = false;
    const supabase = createClient();
    let cancelled = false;

    async function poll() {
      const { data } = await supabase
        .from("render_jobs")
        .select("stage, status, error, created_at")
        .eq("id", jobId)
        .single();

      if (cancelled || !data || settledRef.current) return;

      setStage(data.stage);
      if (data.created_at) {
        setStartedAt(new Date(data.created_at).getTime());
      }

      if (data.status === "succeeded") {
        settledRef.current = true;
        onSucceeded();
        return;
      }
      if (data.status === "failed") {
        settledRef.current = true;
        onFailed(data.error ?? "Something went wrong");
        return;
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => {
      if (settledRef.current) return;
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const currentIndex = stages.indexOf(stage as RenderStage);

  return (
    <div className="space-y-2 rounded-md border p-4">
      {startedAt !== null && (
        <div className="pb-1 text-xs text-muted-foreground">
          {formatElapsed(elapsedSeconds)} elapsed
        </div>
      )}
      {stages.map((s, i) => {
        const isDone = i < currentIndex || (s === "done" && currentIndex === i);
        const isCurrent = i === currentIndex && s !== "done";
        return (
          <div
            key={s}
            className={cn(
              "flex items-center gap-2 text-sm",
              isDone ? "text-foreground" : isCurrent ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {isDone ? (
              <Check className="size-4 text-primary" />
            ) : isCurrent ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span className="size-4" />
            )}
            {STAGE_LABELS[s]}
          </div>
        );
      })}
    </div>
  );
}
