import Link from "next/link";
import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { TOOLS } from "@/content/tools";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Free Tools for Short-Form Video Creators",
  description:
    "Free, no-signup tools for TikTok, Reels, and Shorts creators: hashtag generator, AI voiceover, script generator, video transcripts, and caption burn-in.",
};

export default function ToolsIndexPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-semibold">
          <Wrench className="size-7 text-primary" />
          Free Tools
        </h1>
        <p className="text-muted-foreground">
          Free, no-signup tools for short-form video creators. No account
          needed, just use them.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <Link key={tool.slug} href={`/tools/${tool.slug}`}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <CardTitle>{tool.name}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
