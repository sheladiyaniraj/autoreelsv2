import Link from "next/link";
import { Film, Plus, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("credits, plan")
    .eq("id", user!.id)
    .single();

  const { data: reels } = await supabase
    .from("reels")
    .select("id, title, status, thumb_url, duration, created_at")
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            {profile?.credits ?? 0} credits left on the{" "}
            {profile?.plan ?? "free"} plan.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/create" />}>
          <Plus className="size-4" />
          New reel
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Credits remaining</CardDescription>
            <CardTitle className="text-3xl">{profile?.credits ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reels created</CardDescription>
            <CardTitle className="text-3xl">{reels?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current plan</CardDescription>
            <CardTitle className="text-3xl capitalize">
              {profile?.plan ?? "free"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Your reels</h2>
        {reels && reels.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {reels.map((reel) => (
              <Link key={reel.id} href={`/reels/${reel.id}`}>
                <Card className="overflow-hidden py-0 transition-colors hover:border-primary">
                  {reel.thumb_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={reel.thumb_url}
                      alt={reel.title ?? "Reel thumbnail"}
                      className="aspect-9/16 w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-9/16 items-center justify-center bg-muted">
                      <Film className="size-8 text-muted-foreground" />
                    </div>
                  )}
                  <CardContent className="p-3">
                    <p className="truncate text-sm font-medium">
                      {reel.title ?? "Untitled reel"}
                    </p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {reel.status}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Sparkles className="size-8 text-muted-foreground" />
              <div>
                <p className="font-medium">No reels yet</p>
                <p className="text-sm text-muted-foreground">
                  Generate your first faceless reel in a few minutes.
                </p>
              </div>
              <Button nativeButton={false} render={<Link href="/create" />}>
                <Plus className="size-4" />
                Create your first reel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
