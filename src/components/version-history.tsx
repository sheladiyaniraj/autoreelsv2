"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, History, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Version = {
  id: string;
  video_url: string;
  thumb_url: string;
  duration: number | null;
  created_at: string;
};

export function VersionHistory({
  reelId,
  versions,
  currentVideoUrl,
}: {
  reelId: string;
  versions: Version[];
  currentVideoUrl: string | null;
}) {
  const router = useRouter();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  if (versions.length <= 1) return null;

  async function handleRestore(versionId: string) {
    setRestoringId(versionId);
    try {
      const res = await fetch(`/api/reels/${reelId}/versions/${versionId}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Restore failed");
      toast.success("Version restored");
      router.refresh();
    } catch (err) {
      toast.error("Couldn't restore version", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <History className="size-3.5" />
          Version history
        </p>
        <div className="space-y-2">
          {versions.map((version) => {
            const isCurrent = version.video_url === currentVideoUrl;
            return (
              <div
                key={version.id}
                className="flex items-center gap-3 rounded-md border p-2 text-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={version.thumb_url}
                  alt="Version thumbnail"
                  className="h-12 w-7 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {new Date(version.created_at).toLocaleString()}
                    </span>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-[10px]">
                        Current
                      </Badge>
                    )}
                  </div>
                  {version.duration && (
                    <span className="text-xs text-muted-foreground">
                      {version.duration}s
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  nativeButton={false}
                  render={<a href={version.video_url} download />}
                >
                  <Download className="size-4" />
                </Button>
                {!isCurrent && (
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={restoringId === version.id}
                    onClick={() => handleRestore(version.id)}
                  >
                    {restoringId === version.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RotateCcw className="size-4" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
