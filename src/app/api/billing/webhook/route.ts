import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { track } from "@vercel/analytics/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { planByPriceId, SUBSCRIPTION_PLANS, CREDIT_PACKS } from "@/lib/billing/plans";

export const maxDuration = 30;

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

// Atomically claims an event id via the table's primary-key uniqueness —
// if two overlapping Stripe deliveries race here, only one insert succeeds;
// the other hits a unique violation and is treated as already-claimed. This
// closes the check-then-insert window a separate SELECT-then-INSERT would
// leave open.
async function claimEvent(admin: ReturnType<typeof createAdminClient>, eventId: string) {
  const { error } = await admin.from("stripe_events").insert({ id: eventId });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw error;
}

async function releaseEvent(admin: ReturnType<typeof createAdminClient>, eventId: string) {
  await admin.from("stripe_events").delete().eq("id", eventId);
}

async function findUserByCustomerId(
  admin: ReturnType<typeof createAdminClient>,
  customerId: string
) {
  const { data } = await admin
    .from("users")
    .select("id, plan")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data;
}

async function addCredits(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  amount: number,
  reason: string,
  refId: string
) {
  // Single atomic UPDATE...RETURNING + ledger insert inside one Postgres
  // function — a JS-side SELECT-then-UPDATE here would lose an update
  // whenever Stripe redelivers an overlapping event concurrently.
  const { error } = await admin.rpc("add_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_ref_id: refId,
  });
  if (error) throw error;
}

async function handleCheckoutCompleted(
  admin: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  if (session.mode !== "payment") return; // subscriptions are credited via invoice.paid

  const userId = session.metadata?.supabase_user_id;
  const packKey = session.metadata?.key as keyof typeof CREDIT_PACKS | undefined;
  if (!userId || !packKey || !(packKey in CREDIT_PACKS)) return;

  const pack = CREDIT_PACKS[packKey];
  await addCredits(admin, userId, pack.credits, "credit_pack_purchase", session.id);
  await track("purchase", { type: "credit_pack", pack: packKey });
}

async function handleInvoicePaid(
  admin: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  const subscriptionId = idOf(invoice.parent?.subscription_details?.subscription ?? null);
  if (!subscriptionId) return; // one-time invoice, not a subscription renewal

  const customerId = idOf(invoice.customer);
  if (!customerId) return;

  const user = await findUserByCustomerId(admin, customerId);
  if (!user) return;

  const priceId = idOf(invoice.lines.data[0]?.pricing?.price_details?.price ?? null);
  const planKey = priceId ? planByPriceId(priceId) : null;
  if (!planKey) return;

  const plan = SUBSCRIPTION_PLANS[planKey];
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const periodEnd = subscription.items.data[0]?.current_period_end;

  await admin
    .from("users")
    .update({ plan: planKey })
    .eq("id", user.id);

  await admin.from("subscriptions").upsert(
    {
      user_id: user.id,
      provider: "stripe",
      plan: planKey,
      status: subscription.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    },
    { onConflict: "user_id" }
  );

  await addCredits(admin, user.id, plan.credits, "subscription_credit_grant", invoice.id ?? subscriptionId);
  await track("purchase", { type: "subscription", plan: planKey });
}

async function handleSubscriptionUpdated(
  admin: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const customerId = idOf(subscription.customer);
  if (!customerId) return;
  const user = await findUserByCustomerId(admin, customerId);
  if (!user) return;

  const priceId = subscription.items.data[0]?.price.id;
  const planKey = priceId ? planByPriceId(priceId) : null;
  const periodEnd = subscription.items.data[0]?.current_period_end;

  await admin.from("subscriptions").upsert(
    {
      user_id: user.id,
      provider: "stripe",
      plan: planKey ?? user.plan,
      status: subscription.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    },
    { onConflict: "user_id" }
  );

  if (planKey && subscription.status === "active") {
    await admin.from("users").update({ plan: planKey }).eq("id", user.id);
  }
}

async function handleSubscriptionDeleted(
  admin: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const customerId = idOf(subscription.customer);
  if (!customerId) return;
  const user = await findUserByCustomerId(admin, customerId);
  if (!user) return;

  await admin.from("users").update({ plan: "free" }).eq("id", user.id);
  await admin
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("user_id", user.id)
    .eq("provider", "stripe");
}

async function handleChargeRefunded(
  admin: ReturnType<typeof createAdminClient>,
  charge: Stripe.Charge
) {
  const customerId = idOf(charge.customer);
  if (!customerId) return;
  const user = await findUserByCustomerId(admin, customerId);
  if (!user) return;

  // Best-effort: claw back credits equal to whatever this charge originally
  // granted, looking up the matching ledger entry by ref_id.
  const paymentIntentId =
    idOf(charge.payment_intent);
  if (!paymentIntentId) return;

  const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
  const session = sessions.data[0];
  if (!session) return;

  const { data: ledgerEntry } = await admin
    .from("credit_ledger")
    .select("delta")
    .eq("ref_id", session.id)
    .eq("reason", "credit_pack_purchase")
    .maybeSingle();

  if (ledgerEntry) {
    await addCredits(admin, user.id, -ledgerEntry.delta, "refund", charge.id);
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (!(await claimEvent(admin, event.id))) {
    return NextResponse.json({ received: true, deduped: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(admin, event.data.object);
        break;
      case "invoice.paid":
        await handleInvoicePaid(admin, event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(admin, event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(admin, event.data.object);
        break;
      case "charge.refunded":
        await handleChargeRefunded(admin, event.data.object);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook handler failed", event.type, err);
    // Release the claim so Stripe's automatic retry can re-attempt this
    // event instead of being permanently deduped against a failed run.
    await releaseEvent(admin, event.id);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
