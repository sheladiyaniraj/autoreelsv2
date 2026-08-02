import Link from "next/link";
import type { Metadata } from "next";
import {
  Captions,
  Clapperboard,
  Download,
  Globe2,
  Layers,
  Mic,
  Music,
  RefreshCw,
  ScanFace,
  Sparkles,
  SquareStack,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Everything AutoReels automates to turn a topic into a finished faceless reel — script, voiceover, AI visuals, captions, music, and editing, in detail.",
};

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI script from any topic",
    description:
      "Give it a topic, a URL, or your own script — get a hook-first, 60-90 word narration back in seconds, sized for a 25-35 second reel.",
  },
  {
    icon: Mic,
    title: "Natural voiceover",
    description:
      "Pick from OpenAI and ElevenLabs voices with real previews before you commit — no recording your own voice.",
  },
  {
    icon: Layers,
    title: "AI B-roll, per scene",
    description:
      "Choose Flux or Google's Nano Banana 2 to generate a fresh, on-topic visual for every scene automatically — no stock footage that almost fits.",
  },
  {
    icon: Captions,
    title: "Karaoke-style captions",
    description:
      "Word-by-word highlighted captions, burned in and timed automatically from the voiceover — built for the majority of viewers watching on mute.",
  },
  {
    icon: Music,
    title: "Auto-ducked music",
    description:
      "Background music that automatically drops under your voiceover and comes back up in the gaps — no manual mixing.",
  },
  {
    icon: RefreshCw,
    title: "Edit after generating",
    description:
      "Swap a single scene's visual, or re-voice the entire reel, without regenerating everything else from scratch.",
  },
  {
    icon: Globe2,
    title: "Multi-language",
    description:
      "English, Hindi, Gujarati, Arabic, and more — script, voice, and captions stay in sync in whichever language you generate in.",
  },
  {
    icon: SquareStack,
    title: "9:16, 1:1, or 16:9",
    description:
      "One input, the right export for Reels/Shorts/TikTok, a feed post, or YouTube — no manual cropping after the fact.",
  },
  {
    icon: ScanFace,
    title: "Faceless by design",
    description:
      "Every reel is fully AI-generated — no camera, no filming, no on-camera anxiety.",
  },
  {
    icon: Download,
    title: "Download, HD",
    description:
      "Export the finished MP4 directly — no watermark on paid plans.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <Clapperboard className="size-5" />
            AutoReels
          </Link>
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-muted-foreground sm:flex">
            <Link href="/blog" className="transition-colors hover:text-foreground">
              Blog
            </Link>
            <Link href="/tools" className="transition-colors hover:text-foreground">
              Free Tools
            </Link>
          </nav>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/login" />}>
              Log in
            </Button>
            <Button size="sm" className="rounded-full px-4" nativeButton={false} render={<Link href="/signup" />}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center sm:pt-28">
          <Reveal>
            <h1 className="text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
              Everything a reel needs, automated
            </h1>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-6 text-lg text-balance text-muted-foreground sm:text-xl">
              One generation covers the whole pipeline — script, voice, visuals, captions, and
              music — instead of chaining together five separate tools.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <Button
              size="lg"
              className="mt-8 h-11 rounded-full px-7 text-[15px]"
              nativeButton={false}
              render={<Link href="/signup" />}
            >
              Get 3 free reels
            </Button>
          </Reveal>
        </section>

        <section className="border-t border-border/60 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-px overflow-hidden rounded-3xl bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, i) => (
                <Reveal key={feature.title} delay={(i % 3) * 60}>
                  <div className="h-full bg-background p-8">
                    <feature.icon className="size-6" strokeWidth={1.5} />
                    <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 py-20 text-center">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              See the full pipeline in action
            </h2>
            <p className="mt-3 text-muted-foreground">
              Read exactly how each step works, start to finish.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button variant="outline" className="rounded-full" nativeButton={false} render={<Link href="/blog/how-to-make-faceless-reels-with-ai" />}>
                Read the full guide
              </Button>
              <Button className="rounded-full" nativeButton={false} render={<Link href="/signup" />}>
                Try it free
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border/60 px-6 py-10 text-center text-sm text-muted-foreground">
        <div className="mb-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <Link href="/blog" className="hover:text-foreground">
            Blog
          </Link>
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/refund" className="hover:text-foreground">
            Refund Policy
          </Link>
        </div>
        © {new Date().getFullYear()} AutoReels. All rights reserved.
      </footer>
    </div>
  );
}
