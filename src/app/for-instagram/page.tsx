import Link from "next/link";
import type { Metadata } from "next";
import {
  Captions,
  Clapperboard,
  Download,
  Layers,
  Mic,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SUBSCRIPTION_PLANS, type PlanKey } from "@/lib/billing/plans";

export const metadata: Metadata = {
  title: "AI Instagram Reels Generator",
  description:
    "Build a faceless Instagram Reels page without filming or editing. AutoReels writes the script, records the voiceover, generates visuals, and burns in captions automatically.",
  openGraph: {
    title: "AI Instagram Reels Generator — AutoReels",
    description:
      "Build a faceless Instagram Reels page without filming or editing. Script, voiceover, visuals, and captions, generated automatically.",
  },
};

const STATS = [
  { icon: Timer, label: "Minutes, not hours", description: "From a topic to a finished Reel in one sitting." },
  { icon: Sparkles, label: "No camera required", description: "Every Reel is fully AI-generated — no filming, no face." },
  { icon: Zap, label: "Batch-friendly", description: "Queue a week of Reels in one afternoon with bulk create." },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "Hook-first scripts",
    description: "Every script opens with a pattern-interrupt hook built for the first two seconds — the window where Instagram decides whether to keep pushing your Reel.",
  },
  {
    icon: Mic,
    title: "Natural AI voiceover",
    description: "Real OpenAI and ElevenLabs voices with previews before you commit — no recording your own voice.",
  },
  {
    icon: Captions,
    title: "Auto-burned captions",
    description: "Word-by-word karaoke-style captions, since most Reels get watched on mute.",
  },
  {
    icon: Layers,
    title: "9:16, Reels-native",
    description: "Every Reel renders full-bleed vertical at 1080×1920 — no cropping or letterboxing after export.",
  },
  {
    icon: Clapperboard,
    title: "A consistent look",
    description: "Pick one image model and caption style once, and every Reel on your page shares the same visual identity.",
  },
  {
    icon: Download,
    title: "Download or share",
    description: "Export the finished MP4 in HD, or share a link straight from your library.",
  },
];

const PLAN_ORDER: PlanKey[] = ["starter", "pro"];

export default function ForInstagramPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Clapperboard className="size-5 text-primary" />
          AutoReels
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <Link href="/tools" className="hover:text-foreground">
            Free Tools
          </Link>
          <Link href="/ideas" className="hover:text-foreground">
            Reel Ideas
          </Link>
          <Link href="/blog" className="hover:text-foreground">
            Blog
          </Link>
        </nav>
        <div className="flex gap-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
            Log in
          </Button>
          <Button nativeButton={false} render={<Link href="/signup" />}>
            Sign up free
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="flex flex-col items-center justify-center gap-6 px-6 py-12 text-center sm:py-20">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
            AI Instagram Reels Generator
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Build a faceless Instagram Reels page without filming or editing.
            AutoReels writes the script, records the voiceover, generates the
            visuals, and burns in the captions — automatically.
          </p>
          <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
            <Sparkles className="size-4" />
            Get 3 free reels
          </Button>
          <p className="text-xs text-muted-foreground">
            No card required · No watermark on paid plans
          </p>
        </section>

        <section className="mx-auto grid w-full max-w-4xl gap-4 px-6 pb-16 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
              <stat.icon className="size-6 text-primary" />
              <p className="font-semibold">{stat.label}</p>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
          <h2 className="mb-4 text-2xl font-semibold sm:text-3xl">
            The fastest way to grow a faceless Instagram page
          </h2>
          <p className="text-muted-foreground">
            The Instagram algorithm rewards accounts that post consistently —
            but writing, recording, and editing a Reel by hand takes real
            time. AutoReels collapses that whole process into one step, so
            you can queue a week&apos;s worth of Reels in a single sitting
            instead of filming one at a time.
          </p>
        </section>

        <section className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="mb-8 text-center text-2xl font-semibold">
            Everything a Reel needs, generated automatically
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
            1 credit = 1 Reel. No watermark on paid plans. Cancel anytime.
          </p>
        </section>

        <section className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold">Ready to post your first Reel?</h2>
          <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
            <Sparkles className="size-4" />
            Start your page free
          </Button>
        </section>
      </main>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <div className="mb-3 flex justify-center gap-6">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <Link href="/tools" className="hover:text-foreground">
            Free Tools
          </Link>
          <Link href="/blog" className="hover:text-foreground">
            Blog
          </Link>
          <Link href="/ideas" className="hover:text-foreground">
            Reel Ideas
          </Link>
        </div>
        © {new Date().getFullYear()} AutoReels. All rights reserved.
      </footer>
    </div>
  );
}
