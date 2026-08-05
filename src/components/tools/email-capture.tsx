"use client";

import { useState } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function EmailCapture({ tool }: { tool: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleSubmit() {
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/tools/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tool }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
        <Check className="size-4 text-primary" />
        You&apos;re in, we&apos;ll send more free tools and tips your way.
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Mail className="size-3.5" />
        Get new free tools + tips in your inbox
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-8 text-sm"
        />
        <Button
          size="sm"
          disabled={status === "loading" || !email.trim()}
          onClick={handleSubmit}
        >
          {status === "loading" ? <Loader2 className="size-3.5 animate-spin" /> : "Notify me"}
        </Button>
      </div>
    </div>
  );
}
