"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type User = {
  id: string;
  email: string;
  plan: string;
  credits: number;
  is_admin: boolean;
  banned: boolean;
  created_at: string;
  country: string | null;
  claimed: boolean;
};

export function AdminUsersTable({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function grantCredits(userId: string) {
    const amount = Number(amounts[userId]);
    if (!Number.isFinite(amount) || amount === 0 || !Number.isInteger(amount)) {
      toast.error("Enter a non-zero whole number");
      return;
    }
    setPendingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/grant-credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`${amount > 0 ? "Granted" : "Removed"} ${Math.abs(amount)} credits`);
      setAmounts((prev) => ({ ...prev, [userId]: "" }));
      router.refresh();
    } catch (err) {
      toast.error("Couldn't update credits", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setPendingId(null);
    }
  }

  async function toggleBan(userId: string, banned: boolean) {
    setPendingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(banned ? "User suspended" : "User unsuspended");
      router.refresh();
    } catch (err) {
      toast.error("Couldn't update user", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card>
      <CardContent className="divide-y p-0">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <div className="min-w-48 flex-1">
              <p className="flex items-center gap-1.5 font-medium">
                {u.email}
                {u.is_admin && (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <ShieldCheck className="size-3" />
                    Admin
                  </Badge>
                )}
                {u.banned && (
                  <Badge variant="outline" className="gap-1 text-[10px] text-destructive">
                    Suspended
                  </Badge>
                )}
                {!u.claimed && (
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    Imported · not signed in
                  </Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {u.plan} · {u.credits} credits{u.country ? ` · ${u.country}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                placeholder="±credits"
                value={amounts[u.id] ?? ""}
                onChange={(e) =>
                  setAmounts((prev) => ({ ...prev, [u.id]: e.target.value }))
                }
                className="w-24"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={pendingId === u.id}
                onClick={() => grantCredits(u.id)}
              >
                {pendingId === u.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </div>

            {u.id !== currentUserId && (
              <Button
                variant="outline"
                size="sm"
                disabled={pendingId === u.id}
                onClick={() => toggleBan(u.id, !u.banned)}
              >
                <Ban className="size-3.5" />
                {u.banned ? "Unsuspend" : "Suspend"}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
