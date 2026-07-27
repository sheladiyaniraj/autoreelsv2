import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SUBSCRIPTION_PLANS, CREDIT_PACKS } from "@/lib/billing/plans";
import { estimateReelCost } from "@/lib/cost-estimates";

function parsePriceUsd(priceLabel: string): number {
  const match = priceLabel.match(/\$(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

export default async function AdminOverviewPage() {
  const adminUser = await requireAdminUser();
  if (!adminUser) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();

  // eslint-disable-next-line react-hooks/purity -- server component, computed once per request, not during a re-render
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: userCount },
    { count: reelsReady },
    { count: reelsProcessing },
    { count: reelsFailed },
    { count: activeSubs },
    { data: recentPurchases },
    { data: readyReels },
    { data: voices },
    { data: allScenes },
  ] = await Promise.all([
    admin.from("users").select("id", { count: "exact", head: true }),
    admin.from("reels").select("id", { count: "exact", head: true }).eq("status", "ready"),
    admin
      .from("reels")
      .select("id", { count: "exact", head: true })
      .in("status", ["queued", "processing"]),
    admin.from("reels").select("id", { count: "exact", head: true }).eq("status", "failed"),
    admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin
      .from("credit_ledger")
      .select("delta, reason, created_at")
      .in("reason", ["credit_pack_purchase", "subscription_credit_grant"])
      .gte("created_at", thirtyDaysAgo),
    admin.from("reels").select("id, image_model, duration, voice_id, words_json").eq("status", "ready"),
    admin.from("voices").select("id, provider"),
    admin.from("scenes").select("reel_id"),
  ]);

  const { count: emailLeads } = await admin
    .from("email_leads")
    .select("id", { count: "exact", head: true });

  // Revenue is estimated from local ledger amounts against known static
  // prices (not a live Stripe balance query) — good enough for a quick
  // internal signal, not accounting.
  const packByCredits = new Map(
    Object.values(CREDIT_PACKS).map((p) => [p.credits, parsePriceUsd(p.priceLabel)])
  );
  const planByCredits = new Map(
    Object.values(SUBSCRIPTION_PLANS).map((p) => [p.credits, parsePriceUsd(p.priceLabel)])
  );

  const revenueLast30d = (recentPurchases ?? []).reduce((sum, entry) => {
    const price =
      entry.reason === "credit_pack_purchase"
        ? packByCredits.get(entry.delta)
        : planByCredits.get(entry.delta);
    return sum + (price ?? 0);
  }, 0);

  // AI generation cost is estimated from per-unit provider prices against
  // each reel's actual scene count, duration, voice provider, and image
  // model — not a live billing reconciliation, just an internal cost
  // signal. See src/lib/cost-estimates.ts for the underlying rates.
  const voiceProviderById = new Map((voices ?? []).map((v) => [v.id, v.provider]));
  const sceneCountByReel = new Map<string, number>();
  for (const scene of allScenes ?? []) {
    sceneCountByReel.set(scene.reel_id, (sceneCountByReel.get(scene.reel_id) ?? 0) + 1);
  }

  const reelCosts = (readyReels ?? []).map((reel) =>
    estimateReelCost({
      imageModel: reel.image_model,
      voiceProvider: reel.voice_id ? (voiceProviderById.get(reel.voice_id) ?? null) : null,
      sceneCount: sceneCountByReel.get(reel.id) ?? 0,
      durationSeconds: reel.duration,
      wordCount: Array.isArray(reel.words_json) ? reel.words_json.length : 0,
    })
  );
  const totalCost = reelCosts.reduce((sum, c) => sum + c, 0);
  const avgCostPerReel = reelCosts.length > 0 ? totalCost / reelCosts.length : 0;

  const stats = [
    { label: "Total users", value: userCount ?? 0 },
    { label: "Reels ready", value: reelsReady ?? 0 },
    { label: "Reels in progress", value: reelsProcessing ?? 0 },
    { label: "Reels failed", value: reelsFailed ?? 0 },
    { label: "Active subscriptions", value: activeSubs ?? 0 },
    { label: "Free tool email leads", value: emailLeads ?? 0 },
    { label: "Est. revenue (30d)", value: `$${revenueLast30d.toFixed(0)}` },
    { label: "Avg. AI cost / reel", value: `$${avgCostPerReel.toFixed(3)}` },
    { label: "Total est. AI cost (all reels)", value: `$${totalCost.toFixed(2)}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-muted-foreground">Internal overview — not visible to regular users.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Revenue and AI cost figures are estimates from local ledger data and
        known per-unit provider prices, not live billing reconciliation —
        useful as a directional signal, not exact accounting.
      </p>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Manage individual users, credits, and bans on the{" "}
          <a href="/admin/users" className="underline">
            Users
          </a>{" "}
          page, browse every generated reel on the{" "}
          <a href="/admin/reels" className="underline">
            Reels
          </a>{" "}
          page, or see who signed up for tool updates on the{" "}
          <a href="/admin/leads" className="underline">
            Leads
          </a>{" "}
          page.
        </CardContent>
      </Card>
    </div>
  );
}
