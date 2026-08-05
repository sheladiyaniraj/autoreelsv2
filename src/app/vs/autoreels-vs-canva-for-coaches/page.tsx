import Link from "next/link";
import type { Metadata } from "next";
import { Check, Clapperboard, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "AutoReels vs Canva for Coaches",
  description:
    "Canva and AutoReels solve different problems for coaches building a content presence: Canva for static graphics and carousels, AutoReels for narrated faceless video reels. Here's how they actually compare.",
};

const ROWS: [string, boolean | string, boolean | string][] = [
  ["Static graphics, carousels, worksheets", true, false],
  ["Brand kit / templates library", true, false],
  ["Script writing from a topic", false, true],
  ["AI voiceover generation", false, true],
  ["Per-scene AI visuals for a video", false, true],
  ["Auto-timed, burned-in captions", "Manual", true],
  ["Narrated reel from a topic, in one step", false, true],
  ["Background music auto-ducking", false, true],
];

export default function VsCanvaPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <Clapperboard className="size-5" />
            AutoReels
          </Link>
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-muted-foreground sm:flex">
            <Link href="/features" className="transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="/blog" className="transition-colors hover:text-foreground">
              Blog
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
            <Badge variant="outline" className="h-7 gap-1.5 rounded-full px-3 text-[13px] font-medium">
              <Sparkles className="size-3.5" />
              AutoReels vs Canva
            </Badge>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
              Great for your carousels.
              <br />
              Not built for narrated reels.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 text-lg text-balance text-muted-foreground sm:text-xl">
              If you&apos;re a coach posting quote graphics, worksheets, and carousels, Canva is
              genuinely excellent for that. But a narrated, faceless video reel is a different job,
              one Canva wasn&apos;t built to automate.
            </p>
          </Reveal>
          <Reveal delay={240}>
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

        <section className="border-t border-border/60 py-20">
          <div className="mx-auto max-w-3xl px-6">
            <Reveal className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                They solve different problems
              </h2>
              <p className="mt-3 text-muted-foreground">
                Most coaches end up using both, for different content, not the same job.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <div className="mt-10 overflow-hidden rounded-2xl border border-border/60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/40">
                      <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                        What you need
                      </th>
                      <th className="px-5 py-3 text-center font-medium text-muted-foreground">
                        Canva
                      </th>
                      <th className="px-5 py-3 text-center font-medium text-muted-foreground">
                        AutoReels
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map(([label, canva, autoreels], i) => (
                      <tr key={label} className={i % 2 === 1 ? "bg-muted/20" : undefined}>
                        <td className="px-5 py-3">{label}</td>
                        <td className="px-5 py-3 text-center">
                          <CellValue value={canva} />
                        </td>
                        <td className="px-5 py-3 text-center">
                          <CellValue value={autoreels} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Canva added some AI and video tooling over time, but it&apos;s still a general
                design tool at heart: you&apos;re editing a template, not generating a narrated
                video from a topic in one step.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="border-t border-border/60 bg-muted/30 py-20">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                For coaches specifically
              </h2>
              <p className="mt-4 text-muted-foreground">
                Client testimonials, &ldquo;3 mistakes I see coaches make,&rdquo; a quick mindset tip, a
                program announcement. The content that actually grows a coaching audience is
                usually a person talking, not a static graphic. AutoReels turns that idea into a
                voiced, captioned reel without you filming yourself or writing a script from
                scratch. Keep Canva for your worksheets and carousels; use AutoReels for the
                video.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="border-t border-border/60 py-24 text-center sm:py-28">
          <Reveal>
            <h2 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Try your first reel free
            </h2>
            <Button
              size="lg"
              className="mt-8 h-11 rounded-full px-8 text-[15px]"
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
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <Link href="/features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="/blog" className="hover:text-foreground">
            Blog
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

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto size-4 text-foreground" />;
  if (value === false) return <X className="mx-auto size-4 text-muted-foreground/40" />;
  return <span className="text-muted-foreground">{value}</span>;
}
