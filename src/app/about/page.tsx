import Link from "next/link";
import type { Metadata } from "next";
import { Clapperboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description: "Why AutoReels exists, and who's building it.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Clapperboard className="size-5 text-primary" />
          AutoReels
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/blog" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
            Blog
          </Link>
          <Button size="sm" nativeButton={false} render={<Link href="/signup" />}>
            <Sparkles className="size-4" />
            Get 3 free reels
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1>About AutoReels</h1>

          <p>
            AutoReels is built by a 23-year-old student, working out of Surat, India — mostly
            solo, mostly in public. There&apos;s no studio, no production team behind it, just a
            product built to solve a problem that&apos;s obvious once you&apos;ve tried to post
            short-form video consistently: writing, voicing, filming or sourcing visuals, and
            editing a single reel takes real time, and doing that daily doesn&apos;t scale for one
            person.
          </p>

          <h2>Why this exists</h2>
          <p>
            Faceless content — reels with no one on camera — was the obvious answer for creators
            who wanted to post without filming themselves. But &ldquo;faceless&rdquo; still meant
            stitching together a script, a text-to-speech tool, stock footage, and a captioning
            app by hand. AutoReels exists to collapse that whole pipeline into one step: give it a
            topic, a script, or a link, and get a finished, captioned reel back.
          </p>

          <h2>Built in public</h2>
          <p>
            This is a young product, still being shaped by what people actually use it for. Some
            of the biggest use cases on the platform — like the{" "}
            <Link href="/blog/fifa-world-cup-2026-faceless-football-pages">
              surge of football/FIFA content
            </Link>{" "}
            during the 2026 World Cup — weren&apos;t things anyone planned for; they showed up in
            the generation data and became worth building around. That&apos;s the intended way
            this grows: watching what real usage looks like, and following it.
          </p>

          <h2>Get in touch</h2>
          <p>
            Feedback, bug reports, feature requests, or just want to say what you&apos;re using
            AutoReels for — email{" "}
            <a href="mailto:ceo@autoreels.in">ceo@autoreels.in</a>. Every message gets read.
          </p>

          <p>
            <Link href="/signup">Try AutoReels free</Link> — 3 reels, no card required.
          </p>
        </article>
      </main>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <div className="mb-3 flex flex-wrap justify-center gap-6">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <Link href="/blog" className="hover:text-foreground">
            Blog
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
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
