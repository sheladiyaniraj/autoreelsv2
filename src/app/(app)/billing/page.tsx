import { headers } from "next/headers";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_PLANS, CREDIT_PACKS, type PlanKey } from "@/lib/billing/plans";
import { SubscribeButton, BuyPackButton, ManageBillingButton } from "@/components/billing-actions";
import { ReferralLink } from "@/components/referral-link";

const PLAN_ORDER: (PlanKey | "free")[] = ["free", "starter", "pro"];

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("plan, credits, stripe_customer_id, referral_code")
    .eq("id", user!.id)
    .single();

  const { data: ledger } = await supabase
    .from("credit_ledger")
    .select("delta, reason, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(15);

  const { count: referralCount } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user!.id);

  const currentPlan = profile?.plan ?? "free";
  // `origin` is only sent on cross-origin fetch/form requests, not on a
  // plain page navigation — use `host` (always present) instead.
  const host = (await headers()).get("host");
  const referralUrl = profile?.referral_code
    ? `https://${host}/signup?ref=${profile.referral_code}`
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-muted-foreground">
          {profile?.credits ?? 0} credits on the{" "}
          <span className="capitalize">{currentPlan}</span> plan.
        </p>
      </div>

      {checkout === "success" && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          Payment successful — your credits have been added.
        </div>
      )}
      {checkout === "cancelled" && (
        <div className="rounded-md border px-4 py-3 text-sm text-muted-foreground">
          Checkout cancelled — no charge was made.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {PLAN_ORDER.map((key) => {
          const isFree = key === "free";
          const plan = isFree ? null : SUBSCRIPTION_PLANS[key];
          const isCurrent = currentPlan === key;

          return (
            <Card key={key} className={isCurrent ? "border-primary" : undefined}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize">{isFree ? "Free" : plan!.name}</CardTitle>
                  {isCurrent && <Badge>Current</Badge>}
                </div>
                <CardDescription>
                  {isFree ? "$0/mo" : plan!.priceLabel} ·{" "}
                  {isFree ? "3 credits on signup" : `${plan!.credits} credits/mo`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isFree ? (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check className="size-3.5" /> Watermarked exports
                  </p>
                ) : (
                  <>
                    <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="size-3.5" /> No watermark
                    </p>
                    <SubscribeButton planKey={key} disabled={isCurrent}>
                      {isCurrent ? "Current plan" : "Subscribe"}
                    </SubscribeButton>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Top up credits</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(Object.entries(CREDIT_PACKS) as [keyof typeof CREDIT_PACKS, (typeof CREDIT_PACKS)[keyof typeof CREDIT_PACKS]][]).map(
            ([key, pack]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle>{pack.name}</CardTitle>
                  <CardDescription>{pack.priceLabel} one-time</CardDescription>
                </CardHeader>
                <CardContent>
                  <BuyPackButton packKey={key}>Buy</BuyPackButton>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>

      {referralUrl && (
        <div>
          <h2 className="mb-3 text-lg font-medium">Invite friends</h2>
          <Card>
            <CardContent className="space-y-3 pt-6">
              <p className="text-sm text-muted-foreground">
                Share your link — you both get 2 bonus credits when someone
                signs up with it.
                {referralCount ? ` ${referralCount} referral${referralCount === 1 ? "" : "s"} so far.` : ""}
              </p>
              <ReferralLink url={referralUrl} />
            </CardContent>
          </Card>
        </div>
      )}

      {profile?.stripe_customer_id && (
        <div>
          <h2 className="mb-3 text-lg font-medium">Manage subscription</h2>
          <ManageBillingButton />
        </div>
      )}

      {ledger && ledger.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-medium">Recent activity</h2>
          <Card>
            <CardContent className="divide-y p-0">
              {ledger.map((entry, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="capitalize text-muted-foreground">
                    {entry.reason.replaceAll("_", " ")}
                  </span>
                  <span className={entry.delta > 0 ? "text-primary" : "text-foreground"}>
                    {entry.delta > 0 ? "+" : ""}
                    {entry.delta}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
