import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateHashtags } from "@/lib/providers/hashtags";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reelId } = await params;
  const body = (await request.json().catch(() => ({}))) as { force?: boolean };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: reel } = await supabase
    .from("reels")
    .select("id, hashtags")
    .eq("id", reelId)
    .eq("user_id", user.id)
    .single();

  if (!reel) {
    return NextResponse.json({ error: "Reel not found" }, { status: 404 });
  }

  if (reel.hashtags && reel.hashtags.length > 0 && !body.force) {
    return NextResponse.json({ hashtags: reel.hashtags });
  }

  const { data: scenes } = await supabase
    .from("scenes")
    .select("text")
    .eq("reel_id", reelId)
    .order("idx", { ascending: true });

  const script = scenes?.map((s) => s.text).join(" ") ?? "";
  if (!script.trim()) {
    return NextResponse.json({ error: "This reel has no script yet" }, { status: 400 });
  }

  const hashtags = await generateHashtags({ script });

  await supabase.from("reels").update({ hashtags }).eq("id", reelId);

  return NextResponse.json({ hashtags });
}
