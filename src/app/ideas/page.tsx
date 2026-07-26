import Link from "next/link";
import type { Metadata } from "next";
import { NICHES } from "@/content/niches";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Reel Ideas by Niche",
  description:
    "Faceless reel hooks, script examples, and content tips for finance, fitness, real estate, and more.",
};

export default function IdeasIndexPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Reel Ideas by Niche</h1>
        <p className="text-muted-foreground">
          Hooks, script examples, and content tips for faceless reels in your niche.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {NICHES.map((niche) => (
          <Link key={niche.slug} href={`/ideas/${niche.slug}`}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <CardTitle>{niche.name}</CardTitle>
                <CardDescription>{niche.tagline}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
