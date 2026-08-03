import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reelId } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    rating?: number;
    comment?: string;
  };
  const rating = Number(body.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be an integer from 1 to 5" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: reel } = await supabase
    .from("reels")
    .select("id")
    .eq("id", reelId)
    .eq("user_id", user.id)
    .single();

  if (!reel) {
    return NextResponse.json({ error: "Reel not found" }, { status: 404 });
  }

  const { error } = await supabase.from("reel_reviews").insert({
    reel_id: reelId,
    user_id: user.id,
    rating,
    comment: body.comment?.trim() || null,
  });

  if (error) {
    return NextResponse.json({ error: "Couldn't save your review" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
