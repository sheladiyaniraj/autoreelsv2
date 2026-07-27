"use client";

import { useState } from "react";
import { Download, Loader2, Mic } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmailCapture } from "@/components/tools/email-capture";

const VOICES = ["Aria", "Rohan", "Maya", "Diego"];

export function VoiceoverForm() {
  const [text, setText] = useState("");
  const [voiceName, setVoiceName] = useState("Aria");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/ai-voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }
      const blob = await res.blob();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Textarea
        rows={4}
        placeholder="Paste the text you want voiced (max 500 characters)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
      />
      <Select value={voiceName} onValueChange={(v) => v && setVoiceName(v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a voice" />
        </SelectTrigger>
        <SelectContent>
          {VOICES.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button className="w-full" disabled={isLoading || !text.trim()} onClick={handleSubmit}>
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Mic className="size-4" />}
        {isLoading ? "Generating…" : "Generate voiceover"}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {audioUrl && (
        <div className="space-y-3 rounded-md border p-4">
          <audio src={audioUrl} controls className="w-full" />
          <Button
            variant="outline"
            className="w-full"
            nativeButton={false}
            render={<a href={audioUrl} download="voiceover.mp3" />}
          >
            <Download className="size-4" />
            Download MP3
          </Button>
        </div>
      )}

      {audioUrl && <EmailCapture tool="ai-voiceover" />}
    </div>
  );
}
