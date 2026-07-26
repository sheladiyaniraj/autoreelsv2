import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Lightbulb, Quote, Sparkles } from "lucide-react";
import { NICHES, getNiche } from "@/content/niches";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function generateStaticParams() {
  return NICHES.map((n) => ({ niche: n.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ niche: string }>;
}): Promise<Metadata> {
  const { niche: slug } = await params;
  const niche = getNiche(slug);
  if (!niche) return {};

  return {
    title: `${niche.name} Reel Ideas & Hooks`,
    description: niche.tagline,
    openGraph: { title: `${niche.name} Reel Ideas & Hooks`, description: niche.tagline },
  };
}

export default async function NicheIdeasPage({
  params,
}: {
  params: Promise<{ niche: string }>;
}) {
  const { niche: slug } = await params;
  const niche = getNiche(slug);

  if (!niche) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Button variant="ghost" nativeButton={false} render={<Link href="/ideas" />}>
        <ArrowLeft className="size-4" />
        All niches
      </Button>

      <div className="my-6">
        <h1 className="text-3xl font-semibold">{niche.name} Reel Ideas &amp; Hooks</h1>
        <p className="text-muted-foreground">{niche.tagline}</p>
      </div>

      <section className="mb-8 space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-medium">
          <Quote className="size-4 text-primary" />
          Hooks that work in this niche
        </h2>
        <div className="space-y-2">
          {niche.hooks.map((hook) => (
            <Card key={hook}>
              <CardContent className="py-3 text-sm">&ldquo;{hook}&rdquo;</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-lg font-medium">Example script</h2>
        <Card>
          <CardContent className="py-4 text-sm whitespace-pre-wrap">
            {niche.scriptSnippet}
          </CardContent>
        </Card>
      </section>

      <section className="mb-10 space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-medium">
          <Lightbulb className="size-4 text-primary" />
          What actually works
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {niche.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/30 py-10 text-center">
        <h2 className="text-xl font-semibold">
          Turn any of these into a finished {niche.name.toLowerCase()} reel
        </h2>
        <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
          <Sparkles className="size-4" />
          Generate it free
        </Button>
      </div>
    </div>
  );
}
