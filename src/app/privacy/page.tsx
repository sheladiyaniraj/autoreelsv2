import Link from "next/link";
import type { Metadata } from "next";
import { Clapperboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AutoReels collects, uses, and protects your data.",
};

const LAST_UPDATED = "August 1, 2026";

export default function PrivacyPage() {
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
          <h1>Privacy Policy</h1>
          <p className="text-sm text-muted-foreground not-prose">Last updated: {LAST_UPDATED}</p>

          <p>
            This policy explains what information AutoReels (&ldquo;we,&rdquo; &ldquo;us&rdquo;)
            collects when you use autoreels.in (the &ldquo;Service&rdquo;), how we use it, and who
            we share it with. By using the Service, you agree to this policy.
          </p>

          <h2>Information we collect</h2>
          <ul>
            <li>
              <strong>Account information.</strong> Your email address, and — if you sign in with
              Google — your name and profile photo as provided by Google. We use Supabase to
              handle authentication and store account records.
            </li>
            <li>
              <strong>Content you provide.</strong> Topics, URLs, and scripts you enter, along
              with the scripts, voiceovers, images, captions, and videos generated from them.
            </li>
            <li>
              <strong>Payment information.</strong> Subscriptions and credit purchases are
              processed by Stripe. We never see or store your full card number — Stripe handles
              that directly and shares back only what we need to manage your plan (e.g. your
              subscription status and a customer reference ID).
            </li>
            <li>
              <strong>Usage &amp; device data.</strong> Pages visited, features used, approximate
              location (derived from IP address, at country level), browser/device type, and
              similar analytics data, collected via Vercel Analytics, Vercel Speed Insights,
              Google Analytics, Google Tag Manager, and Microsoft Clarity.
            </li>
          </ul>

          <h2>How we use this information</h2>
          <ul>
            <li>To operate the Service — generate your reels, manage your account and credits.</li>
            <li>To process payments and apply the correct plan/credits to your account.</li>
            <li>To send transactional communications, like sign-in links.</li>
            <li>To understand how the Service is used and improve it.</li>
            <li>To detect and prevent abuse, fraud, or violations of our terms.</li>
          </ul>
          <p>We do not sell your personal information.</p>

          <h2>Third-party service providers</h2>
          <p>
            Generating a reel means sending your script/topic text and related data to the
            providers that actually do the generation work. We currently use:
          </p>
          <ul>
            <li>
              <strong>Supabase</strong> — database, authentication, and file storage for
              account/reel records.
            </li>
            <li>
              <strong>Vercel</strong> — application hosting, video/image file storage (Blob), and
              analytics.
            </li>
            <li>
              <strong>Stripe</strong> — payment processing and subscription management.
            </li>
            <li>
              <strong>Anthropic, OpenAI, and Google</strong> — script generation, voice
              transcription, and AI image generation.
            </li>
            <li>
              <strong>ElevenLabs and Sarvam AI</strong> — AI voiceover generation.
            </li>
            <li>
              <strong>Google Analytics, Google Tag Manager, and Microsoft Clarity</strong> —
              product usage analytics.
            </li>
          </ul>
          <p>
            Each of these providers processes data under their own privacy policy and terms. We
            choose providers we believe handle data responsibly, but we encourage you not to
            include sensitive personal information (health details, government ID numbers, etc.)
            in the topics or scripts you generate reels from.
          </p>

          <h2>Cookies &amp; tracking</h2>
          <p>
            We use cookies and similar technology for authentication (keeping you signed in) and
            for the analytics tools listed above. You can block cookies in your browser, though
            parts of the Service — including staying signed in — may not work correctly if you do.
          </p>

          <h2>Data retention</h2>
          <p>
            We retain account and content data for as long as your account is active. If you want
            your account and associated data deleted, contact us (below) and we&apos;ll remove it
            within a reasonable timeframe, except where we&apos;re required to keep records (e.g.
            transaction records for tax/accounting purposes).
          </p>

          <h2>Your rights</h2>
          <p>
            You can ask us to access, correct, or delete the personal information we hold about
            you at any time by emailing us. We&apos;ll respond as quickly as we reasonably can.
          </p>

          <h2>Children&apos;s privacy</h2>
          <p>
            The Service isn&apos;t directed at children under 13, and we don&apos;t knowingly
            collect personal information from them.
          </p>

          <h2>International data transfers</h2>
          <p>
            Several of the providers listed above operate in the United States and other
            countries outside your own. Using the Service means your data may be processed in
            those countries.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We may update this policy as the Service changes. We&apos;ll update the &ldquo;last
            updated&rdquo; date above when we do; continued use of the Service after a change
            means you accept the update.
          </p>

          <h2>Contact</h2>
          <p>
            Questions, data requests, or anything else — email{" "}
            <a href="mailto:ceo@autoreels.in">ceo@autoreels.in</a>.
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
