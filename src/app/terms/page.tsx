import Link from "next/link";
import type { Metadata } from "next";
import { Clapperboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of AutoReels.",
};

const LAST_UPDATED = "August 1, 2026";

export default function TermsPage() {
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
          <h1>Terms of Service</h1>
          <p className="text-sm text-muted-foreground not-prose">Last updated: {LAST_UPDATED}</p>

          <p>
            These terms govern your use of autoreels.in (the &ldquo;Service&rdquo;). By creating
            an account or using the Service, you agree to them. If you don&apos;t agree, don&apos;t
            use the Service.
          </p>

          <h2>The Service</h2>
          <p>
            AutoReels turns a topic, URL, or script you provide into an AI-generated video —
            script, voiceover, visuals, captions, and music. You choose what to generate and what
            to do with the result; we don&apos;t publish or post anything on your behalf.
          </p>

          <h2>Your account</h2>
          <ul>
            <li>You need an account to generate reels. Keep your login credentials secure — you&apos;re responsible for activity on your account.</li>
            <li>You must be at least 13 years old to use the Service.</li>
            <li>One person, one account. Don&apos;t create multiple accounts to get around credit limits.</li>
          </ul>

          <h2>Acceptable use</h2>
          <p>Don&apos;t use AutoReels to generate content that:</p>
          <ul>
            <li>Is illegal, defamatory, or infringes someone else&apos;s rights (copyright, trademark, publicity/likeness).</li>
            <li>Harasses, threatens, or targets a specific person.</li>
            <li>Spreads deliberate misinformation presented as fact.</li>
            <li>Is sexually explicit involving minors, or otherwise violates applicable law.</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate this, without
            refunding remaining credits.
          </p>

          <h2>Your content</h2>
          <p>
            You own what you generate with AutoReels. We don&apos;t claim ownership over your
            scripts, voiceovers, or finished videos. To provide the Service, you grant us a
            license to process, store, and transmit that content — including sending it to the
            third-party AI providers listed in our{" "}
            <Link href="/privacy">Privacy Policy</Link> — solely to generate and deliver it back
            to you.
          </p>
          <p>
            You&apos;re responsible for making sure you have the rights to whatever topic,
            script, or source material you feed into the Service.
          </p>

          <h2>Credits, plans &amp; billing</h2>
          <p>
            Generating a reel costs credits, granted by your plan or a one-time credit pack.
            Billing is handled by Stripe. See our <Link href="/refund">Refund Policy</Link> for
            how credits, subscriptions, and cancellations work.
          </p>

          <h2>Service availability</h2>
          <p>
            We aim to keep AutoReels running reliably, but we don&apos;t guarantee uninterrupted
            access — third-party AI providers, hosting, or payment processors can have outages
            outside our control. If a generation fails due to a technical error on our end, the
            credit is automatically refunded.
          </p>

          <h2>Disclaimers &amp; limitation of liability</h2>
          <p>
            The Service is provided &ldquo;as is,&rdquo; without warranties of any kind. AI-generated
            content can be inaccurate — verify any factual claims before publishing. To the
            extent permitted by law, AutoReels isn&apos;t liable for indirect, incidental, or
            consequential damages arising from your use of the Service, and our total liability
            is limited to the amount you paid us in the past 3 months.
          </p>

          <h2>Termination</h2>
          <p>
            You can stop using the Service and cancel your subscription at any time. We can
            suspend or terminate accounts that violate these terms.
          </p>

          <h2>Changes to these terms</h2>
          <p>
            We may update these terms as the Service evolves. We&apos;ll update the &ldquo;last
            updated&rdquo; date above when we do; continued use after a change means you accept
            the update.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these terms: <a href="mailto:ceo@autoreels.in">ceo@autoreels.in</a>.
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
