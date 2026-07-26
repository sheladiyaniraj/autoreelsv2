"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanKey, PackKey } from "@/lib/billing/plans";

async function goToCheckout(type: "plan" | "pack", key: PlanKey | PackKey) {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, key }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not start checkout");
  window.location.href = data.url;
}

export function SubscribeButton({
  planKey,
  disabled,
  children,
}: {
  planKey: PlanKey;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      className="w-full"
      disabled={disabled || loading}
      onClick={async () => {
        setLoading(true);
        try {
          await goToCheckout("plan", planKey);
        } catch (err) {
          toast.error("Couldn't start checkout", {
            description: err instanceof Error ? err.message : undefined,
          });
          setLoading(false);
        }
      }}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}

export function BuyPackButton({
  packKey,
  children,
}: {
  packKey: PackKey;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="outline"
      className="w-full"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await goToCheckout("pack", packKey);
        } catch (err) {
          toast.error("Couldn't start checkout", {
            description: err instanceof Error ? err.message : undefined,
          });
          setLoading(false);
        }
      }}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/billing/portal", { method: "POST" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Could not open billing portal");
          window.location.href = data.url;
        } catch (err) {
          toast.error("Couldn't open billing portal", {
            description: err instanceof Error ? err.message : undefined,
          });
          setLoading(false);
        }
      }}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      Manage billing
    </Button>
  );
}
