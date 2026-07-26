import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await requireAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: targetUserId } = await params;
  const body = (await request.json().catch(() => ({}))) as { banned?: boolean };

  if (targetUserId === adminUser.id) {
    return NextResponse.json({ error: "Can't ban yourself" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ banned: Boolean(body.banned) })
    .eq("id", targetUserId);

  if (error) {
    return NextResponse.json({ error: "Could not update user" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, banned: Boolean(body.banned) });
}
