import Link from "next/link";
import {
  Captions,
  Clapperboard,
  Layers,
  Mic,
  Music,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SUBSCRIPTION_PLANS, type PlanKey } from "@/lib/billing/plans";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI script from any topic",
    description: "Give it a topic, a URL, or your own script — get a hook-first, scroll-stopping voiceover script in seconds.",
  },
  {
    icon: Mic,
    title: "Natural voiceover",
    description: "Pick from OpenAI and ElevenLabs voices with real previews before you commit.",
  },
  {
    icon: Layers,
    title: "AI B-roll, per scene",
    description: "Choose Flux or Google's Nano Banana 2 to generate matching visuals for every scene automatically.",
  },
  {
    icon: Captions,
    title: "Karaoke-style captions",
    description: "Word-by-word highlighted captions burned in, styled to match your template.",
  },
  {
    icon: Music,
    title: "Auto-ducked music",
    description: "Background music that automatically ducks under your voiceover — no mixing required.",
  },
  {
    icon: Clapperboard,
    title: "Edit after generating",
    description: "Swap a scene's visual, change the voice, or restore a previous version — without starting over.",
  },
];

const PLAN_ORDER: PlanKey[] = ["starter", "pro"];

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 font-semibold">
          <Clapperboard className="size-5 text-primary" />
          AutoReels
        </div>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <Link href="/tools" className="hover:text-foreground">
            Free Tools
          </Link>
          <Link href="/blog" className="hover:text-foreground">
            Blog
          </Link>
          <Link href="/ideas" className="hover:text-foreground">
            Reel Ideas
          </Link>
        </nav>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Log in
          </Button>
          <Button nativeButton={false} render={<Link href="/signup" />}>
            Sign up free
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="flex flex-col items-center justify-center gap-6 px-6 py-20 text-center">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Turn any topic into a faceless reel — no filming, no editing.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            AI script, voiceover, B-roll, captions, and music — ready to
            download or publish to Instagram, TikTok, and YouTube Shorts.
          </p>
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/signup" />}
          >
            Get 3 free reels
          </Button>
        </section>

        <section className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="mb-8 text-center text-2xl font-semibold">
            Everything you need, generated automatically
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="mb-2 size-6 text-primary" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-6 py-16">
          <h2 className="mb-8 text-center text-2xl font-semibold">
            Simple pricing
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>$0/mo · 3 credits on signup</CardDescription>
              </CardHeader>
            </Card>
            {PLAN_ORDER.map((key) => {
              const plan = SUBSCRIPTION_PLANS[key];
              return (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      {plan.priceLabel} · {plan.credits} credits/mo
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            No watermark on paid plans. Cancel anytime.
          </p>
        </section>

        <section className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold">Ready to make your first reel?</h2>
          <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
            Get started free
          </Button>
        </section>
      </main>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <div className="mb-3 flex justify-center gap-6">
          <Link href="/tools" className="hover:text-foreground">
            Free Tools
          </Link>
          <Link href="/blog" className="hover:text-foreground">
            Blog
          </Link>
          <Link href="/ideas" className="hover:text-foreground">
            Reel Ideas
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Log in
          </Link>
        </div>
        © {new Date().getFullYear()} AutoReels. All rights reserved.
      </footer>
    </div>
  );
}
