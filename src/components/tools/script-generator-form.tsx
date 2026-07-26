"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type InputType = "topic" | "url";

export function ScriptGeneratorForm() {
  const [inputType, setInputType] = useState<InputType>("topic");
  const [inputValue, setInputValue] = useState("");
  const [script, setScript] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/script-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputType, inputValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setScript(data.script);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyScript() {
    if (!script) return;
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["topic", "url"] as InputType[]).map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant={inputType === t ? "default" : "outline"}
            onClick={() => setInputType(t)}
            className="capitalize"
          >
            {t}
          </Button>
        ))}
      </div>
      {inputType === "url" ? (
        <Input
          placeholder="https://example.com/article"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      ) : (
        <Textarea
          rows={3}
          placeholder="e.g. 5 morning habits that changed my life"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      )}
      <Button className="w-full" disabled={isLoading || !inputValue.trim()} onClick={handleSubmit}>
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {isLoading ? "Writing…" : "Generate script"}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {script && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm whitespace-pre-wrap">{script}</p>
            <Button variant="outline" className="w-full" onClick={copyScript}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy script"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
