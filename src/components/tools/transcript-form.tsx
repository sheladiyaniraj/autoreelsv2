"use client";

import { useState } from "react";
import { Check, Copy, Download, FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmailCapture } from "@/components/tools/email-capture";

export function TranscriptForm() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ text: string; srt: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit() {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/tools/video-transcript", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyText() {
    if (!result) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-sm text-muted-foreground hover:border-primary">
        <Upload className="size-6" />
        {file ? file.name : "Click to upload a video or audio file (max 25MB)"}
        <input
          type="file"
          accept="video/*,audio/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <Button className="w-full" disabled={isLoading || !file} onClick={handleSubmit}>
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
        {isLoading ? "Transcribing…" : "Generate transcript"}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="max-h-64 overflow-y-auto text-sm whitespace-pre-wrap">{result.text}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={copyText}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy text"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => downloadFile(result.text, "transcript.txt")}
              >
                <Download className="size-4" />
                .txt
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => downloadFile(result.srt, "transcript.srt")}
              >
                <Download className="size-4" />
                .srt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {result && <EmailCapture tool="video-transcript" />}
    </div>
  );
}
