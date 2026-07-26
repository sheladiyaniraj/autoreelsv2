export type PlanKey = "starter" | "pro";
export type PackKey = "pack_10" | "pack_50" | "pack_200";

export const SUBSCRIPTION_PLANS: Record<
  PlanKey,
  { name: string; priceId: string; credits: number; priceLabel: string }
> = {
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_PRICE_STARTER!,
    credits: 30,
    priceLabel: "$15/mo",
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_PRO!,
    credits: 100,
    priceLabel: "$39/mo",
  },
};

export const CREDIT_PACKS: Record<
  PackKey,
  { name: string; priceId: string; credits: number; priceLabel: string }
> = {
  pack_10: {
    name: "10 credits",
    priceId: process.env.STRIPE_PRICE_PACK_10!,
    credits: 10,
    priceLabel: "$8",
  },
  pack_50: {
    name: "50 credits",
    priceId: process.env.STRIPE_PRICE_PACK_50!,
    credits: 50,
    priceLabel: "$30",
  },
  pack_200: {
    name: "200 credits",
    priceId: process.env.STRIPE_PRICE_PACK_200!,
    credits: 200,
    priceLabel: "$100",
  },
};

export function planByPriceId(priceId: string): PlanKey | null {
  const entry = (Object.entries(SUBSCRIPTION_PLANS) as [PlanKey, (typeof SUBSCRIPTION_PLANS)[PlanKey]][]).find(
    ([, plan]) => plan.priceId === priceId
  );
  return entry?.[0] ?? null;
}

export function packByPriceId(priceId: string): PackKey | null {
  const entry = (Object.entries(CREDIT_PACKS) as [PackKey, (typeof CREDIT_PACKS)[PackKey]][]).find(
    ([, pack]) => pack.priceId === priceId
  );
  return entry?.[0] ?? null;
}
