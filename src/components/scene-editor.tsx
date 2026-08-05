"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RenderProgress } from "@/components/render-progress";
import { cn } from "@/lib/utils";

type Scene = {
  idx: number;
  text: string;
  visual_url: string | null;
};

const EDIT_STAGES = ["visuals", "compose", "upload", "done"] as const;

export function SceneEditor({
  reelId,
  scenes,
}: {
  reelId: string;
  scenes: Scene[];
}) {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  async function handleRegenerate(idx: number) {
    setActiveIdx(idx);
    try {
      const res = await fetch(`/api/reels/${reelId}/scenes/${idx}/regenerate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start regeneration");
      setJobId(data.jobId);
    } catch (err) {
      toast.error("Couldn't regenerate scene", {
        description: err instanceof Error ? err.message : undefined,
      });
      setActiveIdx(null);
    }
  }

  function handleSucceeded() {
    toast.success("Scene updated");
    setActiveIdx(null);
    setJobId(null);
    router.refresh();
  }

  function handleFailed(error: string) {
    toast.error("Couldn't regenerate scene", { description: error });
    setActiveIdx(null);
    setJobId(null);
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-medium">Scenes</h2>
        <p className="text-xs text-muted-foreground">
          Swap a scene&apos;s visual and the reel re-renders, no need to redo
          the script or voice.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {scenes.map((scene) => (
          <div key={scene.idx} className="space-y-1">
            <Card className="overflow-hidden py-0">
              {scene.visual_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={scene.visual_url}
                  alt={`Scene ${scene.idx + 1}`}
                  className="aspect-9/16 w-full object-cover"
                />
              ) : (
                <div className="aspect-9/16 w-full bg-muted" />
              )}
            </Card>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full"
              disabled={activeIdx !== null}
              onClick={() => handleRegenerate(scene.idx)}
            >
              <RefreshCw
                className={cn("size-3.5", activeIdx === scene.idx && "animate-spin")}
              />
              Swap
            </Button>
          </div>
        ))}
      </div>
      {jobId && activeIdx !== null && (
        <RenderProgress
          jobId={jobId}
          stages={EDIT_STAGES}
          onSucceeded={handleSucceeded}
          onFailed={handleFailed}
        />
      )}
    </div>
  );
}
