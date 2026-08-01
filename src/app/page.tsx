import Link from "next/link";
import {
  Captions,
  Check,
  Clapperboard,
  Globe2,
  Layers,
  Mic,
  Music,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/marketing/reveal";
import { PhoneMockup } from "@/components/marketing/phone-mockup";
import { SUBSCRIPTION_PLANS, type PlanKey } from "@/lib/billing/plans";

const HERO_VIDEO =
  "https://2pdbyk39rsrkdlfq.public.blob.vercel-storage.com/reels/58a2fa1b-dd27-4f86-b2ac-8e02877657bf/video-1785565164466.mp4";
const HERO_THUMB =
  "https://2pdbyk39rsrkdlfq.public.blob.vercel-storage.com/reels/58a2fa1b-dd27-4f86-b2ac-8e02877657bf/thumb-1785565164466.jpg";
const HERO_SIDE_LEFT =
  "https://2pdbyk39rsrkdlfq.public.blob.vercel-storage.com/reels/c8339937-56da-4c9d-a3a6-88af4e812437/thumb-1785505143245.jpg";
const HERO_SIDE_RIGHT =
  "https://2pdbyk39rsrkdlfq.public.blob.vercel-storage.com/reels/8b76ddb8-ad57-4db5-a8e8-943ea3e1b721/thumb-1785561571821.jpg";

const CAPTIONS_VIDEO =
  "https://2pdbyk39rsrkdlfq.public.blob.vercel-storage.com/reels/d5d4b1c3-deb2-4a32-b7fe-958b775962b2/video-1785564251420.mp4";
const CAPTIONS_THUMB =
  "https://2pdbyk39rsrkdlfq.public.blob.vercel-storage.com/reels/d5d4b1c3-deb2-4a32-b7fe-958b775962b2/thumb-1785564251420.jpg";

const BROLL_THUMBS = [
  "https://2pdbyk39rsrkdlfq.public.blob.vercel-storage.com/reels/723d03f1-0e89-4e19-86e5-11241f3f1cb2/thumb-1785581443116.jpg",
  "https://2pdbyk39rsrkdlfq.public.blob.vercel-storage.com/reels/f293ce61-a449-4cc2-bcaf-d35a6d7793d3/thumb-1785559174468.jpg",
  "https://2pdbyk39rsrkdlfq.public.blob.vercel-storage.com/reels/41011bb2-26ec-4f57-b37b-02a0ed40b64c/thumb-1785434901525.jpg",
  "https://2pdbyk39rsrkdlfq.public.blob.vercel-storage.com/reels/e0d65de2-6b6f-41ef-82f4-f6ec7e71e133/thumb-1785420644397.jpg",
  "https://2pdbyk39rsrkdlfq.public.blob.vercel-storage.com/reels/22cb2d81-8530-44ef-8917-174a163d62ee/thumb-1785346373056.jpg",
  "https://2pdbyk39rsrkdlfq.public.blob.vercel-storage.com/reels/8cb54e92-3a7a-4e55-9146-83661723efdf/thumb-1785476233473.jpg",
];

const NAV_LINKS = [
  { href: "/tools", label: "Free Tools" },
  { href: "/blog", label: "Blog" },
  { href: "/ideas", label: "Reel Ideas" },
];

const COMPACT_FEATURES = [
  {
    icon: Music,
    title: "Music that ducks itself",
    description: "Background music drops under your voiceover automatically — no manual mixing.",
  },
  {
    icon: RefreshCw,
    title: "Edit without starting over",
    description: "Swap one scene's visual or re-voice the whole reel, without regenerating everything.",
  },
  {
    icon: Globe2,
    title: "Speaks your audience's language",
    description: "Hindi, Gujarati, Arabic, and more — script, voice, and captions all in sync.",
  },
];

const PLAN_ORDER: PlanKey[] = ["starter", "pro"];

const WAVEFORM_HEIGHTS = [24, 40, 64, 44, 80, 56, 92, 48, 68, 36, 76, 52, 30, 60, 42, 84];

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* ---------------------------------------------------------------- */}
      {/* Nav                                                              */}
      {/* ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <Clapperboard className="size-5" />
            AutoReels
          </Link>
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-muted-foreground sm:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/login" />}>
              Log in
            </Button>
            <Button
              size="sm"
              className="rounded-full px-4"
              nativeButton={false}
              render={<Link href="/signup" />}
            >
              Get started
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* -------------------------------------------------------------- */}
        {/* Hero                                                           */}
        {/* -------------------------------------------------------------- */}
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center blur-3xl"
          >
            <div className="h-[480px] w-[900px] rounded-full bg-[conic-gradient(from_90deg_at_50%_50%,#c4b5fd_0%,#93c5fd_25%,#fca5a5_50%,#fcd34d_75%,#c4b5fd_100%)] opacity-25" />
          </div>

          <div className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-20 pb-8 text-center sm:pt-28">
            <Reveal>
              <Badge variant="outline" className="h-7 gap-1.5 rounded-full px-3 text-[13px] font-medium">
                <Sparkles className="size-3.5" />
                Script to finished reel, automatically
              </Badge>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-6 max-w-4xl text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-7xl">
                Your next reel.
                <br />
                Written, voiced, and edited by AI.
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-lg text-balance text-muted-foreground sm:text-xl">
                Give it a topic, a script, or a link. Get a fully edited, captioned,
                faceless reel back — ready for Instagram, TikTok, or Shorts.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-11 rounded-full px-7 text-[15px]"
                  nativeButton={false}
                  render={<Link href="/signup" />}
                >
                  Get 3 free reels
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-11 rounded-full px-7 text-[15px]"
                  nativeButton={false}
                  render={<Link href="/blog/how-to-make-faceless-reels-with-ai" />}
                >
                  See how it works
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={320}>
            <div className="mx-auto flex max-w-3xl items-end justify-center gap-4 px-6 pt-4 pb-24 sm:gap-6 sm:pb-32">
              <PhoneMockup
                posterUrl={HERO_SIDE_LEFT}
                className="hidden w-40 -rotate-6 opacity-60 blur-[1px] sm:block sm:translate-y-6"
              />
              <PhoneMockup
                videoUrl={HERO_VIDEO}
                posterUrl={HERO_THUMB}
                className="w-56 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.35)] sm:w-64"
              />
              <PhoneMockup
                posterUrl={HERO_SIDE_RIGHT}
                className="hidden w-40 rotate-6 opacity-60 blur-[1px] sm:block sm:translate-y-6"
              />
            </div>
          </Reveal>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Spotlight 1 — Script + Voice                                   */}
        {/* -------------------------------------------------------------- */}
        <section className="border-t border-border/60 py-24 sm:py-32">
          <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-2">
            <Reveal>
              <div className="max-w-md">
                <p className="text-sm font-semibold text-muted-foreground">Script &amp; voiceover</p>
                <h2 className="mt-3 text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
                  It writes the words.
                  <br />
                  It finds the voice.
                </h2>
                <p className="mt-5 text-lg text-muted-foreground">
                  Drop in a topic, a URL, or your own script. Get a hook-first
                  narration back in seconds, then pick from natural AI voices —
                  with real previews before you commit.
                </p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
                <div className="flex items-end gap-1 sm:gap-1.5">
                  {WAVEFORM_HEIGHTS.map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}px`, animationDelay: `${i * 70}ms` }}
                      className="w-2 flex-1 animate-pulse rounded-full bg-gradient-to-t from-foreground/70 to-foreground/20 sm:w-2.5"
                    />
                  ))}
                </div>
                <div className="mt-8 space-y-2.5 border-t border-border/60 pt-6">
                  <p className="text-sm leading-relaxed text-foreground">
                    <span className="font-medium">
                      &ldquo;Your home office is sabotaging you, and you don&apos;t
                      even know it.&rdquo;
                    </span>
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Here are three fixes that actually work. First, use the
                    two-minute rule...
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                  <Mic className="size-3.5" />
                  Aria · Natural · 32s
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Spotlight 2 — AI B-roll                                        */}
        {/* -------------------------------------------------------------- */}
        <section className="border-t border-border/60 bg-muted/30 py-24 sm:py-32">
          <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-2">
            <Reveal className="order-2 lg:order-1">
              <div className="grid grid-cols-3 gap-3">
                {BROLL_THUMBS.map((src, i) => (
                  <div
                    key={src}
                    className={`aspect-[9/16] overflow-hidden rounded-xl ring-1 ring-border/60 transition-transform duration-300 hover:scale-[1.03] hover:shadow-lg ${
                      i % 2 === 0 ? "translate-y-3" : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="size-full object-cover" />
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120} className="order-1 lg:order-2">
              <div className="max-w-md">
                <p className="text-sm font-semibold text-muted-foreground">AI B-roll</p>
                <h2 className="mt-3 text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
                  Every scene,
                  <br />
                  its own visual.
                </h2>
                <p className="mt-5 text-lg text-muted-foreground">
                  No stock footage that almost fits. Every sentence in your
                  script gets a fresh, on-topic image generated for it — pick
                  Flux for speed or Nano Banana 2 for tricky prompts.
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <Layers className="size-4" />
                  Generated in parallel, matched automatically
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Spotlight 3 — Captions                                         */}
        {/* -------------------------------------------------------------- */}
        <section className="border-t border-border/60 py-24 sm:py-32">
          <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-2">
            <Reveal>
              <div className="max-w-md">
                <p className="text-sm font-semibold text-muted-foreground">Captions</p>
                <h2 className="mt-3 text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
                  Every word,
                  <br />
                  right on beat.
                </h2>
                <p className="mt-5 text-lg text-muted-foreground">
                  Most short-form video is watched on mute. Karaoke-style
                  captions highlight word by word, perfectly timed to the
                  voiceover — burned in, no separate editing app required.
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <Captions className="size-4" />
                  Timed automatically from the voiceover
                </div>
              </div>
            </Reveal>

            <Reveal delay={120} className="flex justify-center">
              <PhoneMockup videoUrl={CAPTIONS_VIDEO} posterUrl={CAPTIONS_THUMB} className="w-64 sm:w-72" />
            </Reveal>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Compact feature grid                                           */}
        {/* -------------------------------------------------------------- */}
        <section className="border-t border-border/60 bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-px overflow-hidden rounded-3xl bg-border/60 sm:grid-cols-3">
              {COMPACT_FEATURES.map((feature, i) => (
                <Reveal key={feature.title} delay={i * 80}>
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

        {/* -------------------------------------------------------------- */}
        {/* Pricing                                                        */}
        {/* -------------------------------------------------------------- */}
        <section className="border-t border-border/60 py-24 sm:py-32">
          <div className="mx-auto max-w-5xl px-6">
            <Reveal className="text-center">
              <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Simple pricing</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Start free. Upgrade when you&apos;re posting daily.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-6 sm:grid-cols-3">
              <Reveal delay={0}>
                <PricingCard
                  name="Free"
                  price="$0"
                  cadence="/mo"
                  description="3 credits on signup"
                  features={["3 reels to try", "All voices & languages", "Watermarked exports"]}
                />
              </Reveal>
              {PLAN_ORDER.map((key, i) => {
                const plan = SUBSCRIPTION_PLANS[key];
                const isPro = key === "pro";
                return (
                  <Reveal key={key} delay={(i + 1) * 100}>
                    <PricingCard
                      name={plan.name}
                      price={plan.priceLabel.split("/")[0]}
                      cadence="/mo"
                      description={`${plan.credits} credits every month`}
                      features={[
                        `${plan.credits} reels / mo`,
                        "No watermark",
                        "Scene & voice editing",
                        "Priority generation",
                      ]}
                      highlighted={isPro}
                    />
                  </Reveal>
                );
              })}
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              No watermark on paid plans. Cancel anytime.
            </p>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Final CTA                                                      */}
        {/* -------------------------------------------------------------- */}
        <section className="relative overflow-hidden border-t border-border/60 py-28 sm:py-36">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 flex -translate-y-1/2 justify-center blur-3xl"
          >
            <div className="h-[420px] w-[820px] rounded-full bg-[conic-gradient(from_90deg_at_50%_50%,#c4b5fd_0%,#93c5fd_25%,#fca5a5_50%,#fcd34d_75%,#c4b5fd_100%)] opacity-20" />
          </div>
          <Reveal className="mx-auto flex max-w-2xl flex-col items-center px-6 text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Make your first reel in the next five minutes.
            </h2>
            <Button
              size="lg"
              className="mt-9 h-11 rounded-full px-8 text-[15px]"
              nativeButton={false}
              render={<Link href="/signup" />}
            >
              Get started free
            </Button>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border/60 px-6 py-10 text-center text-sm text-muted-foreground">
        <div className="mb-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
          <Link href="/login" className="hover:text-foreground">
            Log in
          </Link>
        </div>
        © {new Date().getFullYear()} AutoReels. All rights reserved.
      </footer>
    </div>
  );
}

function PricingCard({
  name,
  price,
  cadence,
  description,
  features,
  highlighted = false,
}: {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-3xl border p-7 ${
        highlighted
          ? "border-foreground/15 bg-foreground text-background shadow-xl"
          : "border-border/60 bg-card"
      }`}
    >
      {highlighted && (
        <Badge className="mb-4 h-6 w-fit rounded-full bg-background px-2.5 text-[11px] text-foreground">
          Most popular
        </Badge>
      )}
      <p className={`text-sm font-medium ${highlighted ? "text-background/70" : "text-muted-foreground"}`}>
        {name}
      </p>
      <p className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight">{price}</span>
        <span className={highlighted ? "text-background/70" : "text-muted-foreground"}>{cadence}</span>
      </p>
      <p className={`mt-1 text-sm ${highlighted ? "text-background/70" : "text-muted-foreground"}`}>
        {description}
      </p>
      <ul className="mt-6 flex-1 space-y-3 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <Check className="size-4 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Button
        className={`mt-7 rounded-full ${highlighted ? "bg-background text-foreground hover:bg-background/90" : ""}`}
        variant={highlighted ? undefined : "outline"}
        nativeButton={false}
        render={<Link href="/signup" />}
      >
        Get started
      </Button>
    </div>
  );
}
