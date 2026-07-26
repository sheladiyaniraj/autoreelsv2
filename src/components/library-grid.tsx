"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Film, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DeleteReelButton } from "@/components/delete-reel-button";

type Reel = {
  id: string;
  title: string | null;
  status: string;
  thumb_url: string | null;
  video_url: string | null;
  duration: number | null;
  created_at: string;
};

type StatusFilter = "all" | "ready" | "processing" | "queued" | "failed";

export function LibraryGrid({ initialReels }: { initialReels: Reel[] }) {
  const [reels, setReels] = useState(initialReels);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    return reels.filter((reel) => {
      const matchesStatus = status === "all" || reel.status === status;
      const matchesQuery =
        query.trim().length === 0 ||
        (reel.title ?? "untitled reel")
          .toLowerCase()
          .includes(query.trim().toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [reels, query, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Tabs value={status} onValueChange={(v) => v && setStatus(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ready">Ready</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="queued">Queued</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Sparkles className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {reels.length === 0 ? "No reels yet" : "No reels match"}
              </p>
              <p className="text-sm text-muted-foreground">
                {reels.length === 0
                  ? "Generate your first faceless reel in a few minutes."
                  : "Try a different search term or status filter."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((reel) => (
            <Card key={reel.id} className="overflow-hidden py-0">
              <Link href={`/reels/${reel.id}`}>
                {reel.thumb_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={reel.thumb_url}
                    alt={reel.title ?? "Reel thumbnail"}
                    className="aspect-9/16 w-full object-cover transition-opacity hover:opacity-90"
                  />
                ) : (
                  <div className="flex aspect-9/16 items-center justify-center bg-muted">
                    <Film className="size-8 text-muted-foreground" />
                  </div>
                )}
              </Link>
              <CardContent className="space-y-2 p-3">
                <Link href={`/reels/${reel.id}`}>
                  <p className="truncate text-sm font-medium hover:underline">
                    {reel.title ?? "Untitled reel"}
                  </p>
                </Link>
                <div className="flex items-center justify-between">
                  <Badge
                    variant={reel.status === "ready" ? "secondary" : "outline"}
                    className="capitalize"
                  >
                    {reel.status}
                  </Badge>
                  {reel.duration && (
                    <span className="text-xs text-muted-foreground">
                      {reel.duration}s
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {reel.status === "ready" && reel.video_url && (
                    <Button
                      variant="outline"
                      size="icon"
                      nativeButton={false}
                      render={<a href={reel.video_url} download />}
                    >
                      <Download className="size-4" />
                    </Button>
                  )}
                  <DeleteReelButton
                    reelId={reel.id}
                    size="icon"
                    onDeleted={() =>
                      setReels((prev) => prev.filter((r) => r.id !== reel.id))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
