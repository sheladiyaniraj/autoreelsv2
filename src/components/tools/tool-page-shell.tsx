import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ToolPageShell({
  title,
  description,
  children,
  about,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  about?: React.ReactNode;
}) {
  return (
    <div>
      <Button variant="ghost" nativeButton={false} render={<Link href="/tools" />}>
        <ArrowLeft className="size-4" />
        All tools
      </Button>

      <div className="my-6">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {children}

      {about && <div className="mt-10 space-y-3 text-sm text-muted-foreground">{about}</div>}

      <div className="mt-10 flex flex-col items-center gap-3 rounded-lg border bg-muted/30 py-10 text-center">
        <h2 className="text-xl font-semibold">
          Want the full reel, not just this piece?
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          AutoReels turns a topic into a finished faceless reel — script,
          voiceover, visuals, captions, and music — in one step.
        </p>
        <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
          <Sparkles className="size-4" />
          Get 3 free reels
        </Button>
      </div>
    </div>
  );
}
