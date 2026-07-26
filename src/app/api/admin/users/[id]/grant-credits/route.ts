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
  const body = (await request.json().catch(() => ({}))) as { amount?: number };
  const amount = Number(body.amount);

  if (!Number.isFinite(amount) || amount === 0 || !Number.isInteger(amount)) {
    return NextResponse.json({ error: "Amount must be a non-zero integer" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("users")
    .select("credits")
    .eq("id", targetUserId)
    .single();

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const newBalance = target.credits + amount;
  if (newBalance < 0) {
    return NextResponse.json({ error: "Would result in negative balance" }, { status: 400 });
  }

  await admin.from("users").update({ credits: newBalance }).eq("id", targetUserId);
  await admin.from("credit_ledger").insert({
    user_id: targetUserId,
    delta: amount,
    reason: "admin_grant",
    ref_id: adminUser.id,
  });

  return NextResponse.json({ credits: newBalance });
}
