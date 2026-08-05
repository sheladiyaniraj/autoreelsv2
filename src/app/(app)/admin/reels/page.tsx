import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Download, Film } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_FILTERS = ["all", "ready", "processing", "failed"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_BADGE_VARIANT: Record<string, "secondary" | "outline"> = {
  ready: "secondary",
  queued: "outline",
  processing: "outline",
  failed: "outline",
};

function formatGenDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default async function AdminReelsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const adminUser = await requireAdminUser();
  if (!adminUser) {
    redirect("/dashboard");
  }

  const { status } = await searchParams;
  const statusFilter: StatusFilter = STATUS_FILTERS.includes(status as StatusFilter)
    ? (status as StatusFilter)
    : "all";

  const admin = createAdminClient();

  const [{ count: totalCount }, { count: readyCount }, { count: processingCount }, { count: failedCount }] =
    await Promise.all([
      admin.from("reels").select("id", { count: "exact", head: true }),
      admin.from("reels").select("id", { count: "exact", head: true }).eq("status", "ready"),
      admin.from("reels").select("id", { count: "exact", head: true }).in("status", ["queued", "processing"]),
      admin.from("reels").select("id", { count: "exact", head: true }).eq("status", "failed"),
    ]);

  let query = admin
    .from("reels")
    .select("id, title, status, video_url, thumb_url, image_model, duration, aspect_ratio, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(200);

  if (statusFilter === "processing") {
    query = query.in("status", ["queued", "processing"]);
  } else if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: reels } = await query;

  const userIds = [...new Set((reels ?? []).map((r) => r.user_id).filter(Boolean))];
  const { data: users } = userIds.length
    ? await admin.from("users").select("id, email").in("id", userIds)
    : { data: [] };
  const emailByUserId = new Map((users ?? []).map((u) => [u.id, u.email]));

  // A reel can have several render_jobs rows (the initial generation, plus
  // any later scene regen / voice change) — they all share reel_id, so the
  // earliest one by created_at is always the original full-generation job.
  const reelIds = (reels ?? []).map((r) => r.id);
  const { data: jobs } = reelIds.length
    ? await admin
        .from("render_jobs")
        .select("reel_id, created_at, completed_at")
        .in("reel_id", reelIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const genJobByReelId = new Map<string, { created_at: string; completed_at: string | null }>();
  for (const job of jobs ?? []) {
    if (!genJobByReelId.has(job.reel_id)) {
      genJobByReelId.set(job.reel_id, job);
    }
  }

  const genDurationsMs = [...genJobByReelId.values()]
    .filter((j) => j.completed_at)
    .map((j) => new Date(j.completed_at!).getTime() - new Date(j.created_at).getTime());
  const avgGenDurationMs = genDurationsMs.length
    ? genDurationsMs.reduce((sum, ms) => sum + ms, 0) / genDurationsMs.length
    : null;

  const stats = [
    { label: "Total reels", value: totalCount ?? 0 },
    { label: "Ready", value: readyCount ?? 0 },
    { label: "In progress", value: processingCount ?? 0 },
    { label: "Failed", value: failedCount ?? 0 },
    {
      label: "Avg generation time",
      value: avgGenDurationMs !== null ? formatGenDuration(avgGenDurationMs) : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" nativeButton={false} render={<Link href="/admin" />}>
        <ArrowLeft className="size-4" />
        Back to overview
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Reels</h1>
        <p className="text-muted-foreground">
          Every reel generated across all users, most recent 200
          {statusFilter !== "all" ? `, filtered to ${statusFilter}` : ""}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl">{s.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={statusFilter === f ? "default" : "outline"}
            nativeButton={false}
            render={<Link href={f === "all" ? "/admin/reels" : `/admin/reels?status=${f}`} />}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {(reels ?? []).length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No reels match this filter.</p>
          )}
          {(reels ?? []).map((reel) => {
            const genJob = genJobByReelId.get(reel.id);
            const genDurationLabel = genJob?.completed_at
              ? formatGenDuration(
                  new Date(genJob.completed_at).getTime() - new Date(genJob.created_at).getTime()
                )
              : null;

            return (
              <div key={reel.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                  {reel.thumb_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={reel.thumb_url} alt="" className="size-full object-cover" />
                  ) : (
                    <Film className="size-5 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-48 flex-1">
                  <p className="flex items-center gap-1.5 font-medium">
                    {reel.title ?? "Untitled reel"}
                    <Badge
                      variant={STATUS_BADGE_VARIANT[reel.status] ?? "outline"}
                      className="text-[10px] capitalize"
                    >
                      {reel.status}
                    </Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {emailByUserId.get(reel.user_id) ?? "Unknown user"} ·{" "}
                    {new Date(reel.created_at).toLocaleString()}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  {reel.image_model ?? "—"}
                  {reel.duration ? ` · ${reel.duration}s` : ""}
                  {reel.aspect_ratio ? ` · ${reel.aspect_ratio}` : ""}
                </p>

                <Badge variant="outline" className="text-[10px]">
                  {genDurationLabel ? `Generated in ${genDurationLabel}` : "Gen time n/a"}
                </Badge>

                {reel.video_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    nativeButton={false}
                    render={<a href={reel.video_url} target="_blank" rel="noopener noreferrer" />}
                  >
                    <Download className="size-3.5" />
                    View
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
