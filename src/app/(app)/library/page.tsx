import { createClient } from "@/lib/supabase/server";
import { LibraryGrid } from "@/components/library-grid";

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: reels } = await supabase
    .from("reels")
    .select("id, title, status, thumb_url, video_url, duration, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Library</h1>
        <p className="text-muted-foreground">
          All your reels in one place: search, filter, download, or delete.
        </p>
      </div>

      <LibraryGrid initialReels={reels ?? []} />
    </div>
  );
}
