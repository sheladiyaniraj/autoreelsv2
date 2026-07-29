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

  if (target.credits + amount < 0) {
    return NextResponse.json({ error: "Would result in negative balance" }, { status: 400 });
  }

  // Atomic UPDATE...RETURNING + ledger insert in one Postgres function —
  // the pre-check above is a best-effort UX guard, not the source of truth
  // for the arithmetic itself, which this RPC does safely under concurrency.
  const { data: newBalance, error } = await admin.rpc("add_credits", {
    p_user_id: targetUserId,
    p_amount: amount,
    p_reason: "admin_grant",
    p_ref_id: adminUser.id,
  });
  if (error) {
    return NextResponse.json({ error: "Failed to update credits" }, { status: 500 });
  }

  return NextResponse.json({ credits: newBalance });
}
