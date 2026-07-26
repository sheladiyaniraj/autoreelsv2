"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RenderProgress } from "@/components/render-progress";

type Voice = { id: string; name: string; lang: string; gender: string | null; provider: string };

const VOICE_CHANGE_STAGES = ["voice", "transcript", "compose", "upload", "done"] as const;

export function VoiceChanger({
  reelId,
  voices,
  currentVoiceId,
}: {
  reelId: string;
  voices: Voice[];
  currentVoiceId: string | null;
}) {
  const router = useRouter();
  const [voiceId, setVoiceId] = useState(currentVoiceId ?? voices[0]?.id ?? "");
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleChange() {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/reels/${reelId}/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not change voice");
      setJobId(data.jobId);
    } catch (err) {
      toast.error("Couldn't change voice", {
        description: err instanceof Error ? err.message : undefined,
      });
      setIsSubmitting(false);
    }
  }

  function handleSucceeded() {
    toast.success("Voice updated");
    setIsSubmitting(false);
    setJobId(null);
    router.refresh();
  }

  function handleFailed(error: string) {
    toast.error("Couldn't change voice", { description: error });
    setIsSubmitting(false);
    setJobId(null);
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Mic className="size-3.5" />
          Voice
        </p>
        {jobId ? (
          <RenderProgress
            jobId={jobId}
            stages={VOICE_CHANGE_STAGES}
            onSucceeded={handleSucceeded}
            onFailed={handleFailed}
          />
        ) : (
          <div className="flex gap-2">
            <Select value={voiceId} onValueChange={(v) => v && setVoiceId(v)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} · {v.lang} · {v.gender ?? "neutral"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              disabled={isSubmitting || voiceId === currentVoiceId}
              onClick={handleChange}
            >
              Apply
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
