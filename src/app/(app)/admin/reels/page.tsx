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

  const stats = [
    { label: "Total reels", value: totalCount ?? 0 },
    { label: "Ready", value: readyCount ?? 0 },
    { label: "In progress", value: processingCount ?? 0 },
    { label: "Failed", value: failedCount ?? 0 },
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
          Every reel generated across all users — most recent 200
          {statusFilter !== "all" ? `, filtered to ${statusFilter}` : ""}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
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
          {(reels ?? []).map((reel) => (
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
                  <Badge variant={STATUS_BADGE_VARIANT[reel.status] ?? "outline"} className="text-[10px] capitalize">
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
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
