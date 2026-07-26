import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { SUBSCRIPTION_PLANS, CREDIT_PACKS, type PlanKey, type PackKey } from "@/lib/billing/plans";

type CheckoutRequest = {
  type: "plan" | "pack";
  key: PlanKey | PackKey;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<CheckoutRequest>;
  const item =
    body.type === "plan"
      ? SUBSCRIPTION_PLANS[body.key as PlanKey]
      : body.type === "pack"
        ? CREDIT_PACKS[body.key as PackKey]
        : null;

  if (!item) {
    return NextResponse.json({ error: "Unknown plan or pack" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("email, stripe_customer_id")
    .eq("id", user.id)
    .single();

  const admin = createAdminClient();
  let customerId = profile?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await admin.from("users").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const origin = (await headers()).get("origin");

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: body.type === "plan" ? "subscription" : "payment",
    line_items: [{ price: item.priceId, quantity: 1 }],
    success_url: `${origin}/billing?checkout=success`,
    cancel_url: `${origin}/billing?checkout=cancelled`,
    metadata: { supabase_user_id: user.id, type: body.type ?? "", key: body.key ?? "" },
    subscription_data:
      body.type === "plan" ? { metadata: { supabase_user_id: user.id } } : undefined,
  });

  return NextResponse.json({ url: session.url });
}
