"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

const STAGE_LABELS: Record<string, string> = {
  script: "Writing script",
  voice: "Recording voiceover",
  transcript: "Timing captions",
  scene_plan: "Planning scenes",
  visuals: "Generating visuals",
  compose: "Rendering video",
  upload: "Saving reel",
  done: "Done",
};

const POLL_INTERVAL_MS = 1500;

export function BulkItemStatus({ reelId, jobId }: { reelId: string; jobId: string }) {
  const [stage, setStage] = useState("script");
  const [status, setStatus] = useState<"processing" | "succeeded" | "failed">("processing");
  const [error, setError] = useState<string | null>(null);
  const settledRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function poll() {
      const { data } = await supabase
        .from("render_jobs")
        .select("stage, status, error")
        .eq("id", jobId)
        .single();

      if (cancelled || !data || settledRef.current) return;

      setStage(data.stage);
      if (data.status === "succeeded") {
        settledRef.current = true;
        setStatus("succeeded");
      } else if (data.status === "failed") {
        settledRef.current = true;
        setStatus("failed");
        setError(data.error ?? "Something went wrong");
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId]);

  if (status === "succeeded") {
    return (
      <Link href={`/reels/${reelId}`}>
        <Badge variant="secondary" className="gap-1 hover:underline">
          <Check className="size-3" />
          Ready — view
        </Badge>
      </Link>
    );
  }

  if (status === "failed") {
    return (
      <Badge variant="outline" className="gap-1 text-destructive">
        <TriangleAlert className="size-3" />
        Failed{error ? `: ${error.slice(0, 40)}` : ""}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1">
      <Loader2 className="size-3 animate-spin" />
      {STAGE_LABELS[stage] ?? "Working…"}
    </Badge>
  );
}
