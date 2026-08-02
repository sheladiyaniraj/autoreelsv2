import Link from "next/link";
import type { Metadata } from "next";
import { Clapperboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "AutoReels' refund policy for subscriptions and credit packs.",
};

const LAST_UPDATED = "August 1, 2026";

export default function RefundPage() {
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
          <h1>Refund Policy</h1>
          <p className="text-sm text-muted-foreground not-prose">Last updated: {LAST_UPDATED}</p>

          <p>
            This policy covers subscriptions (Starter, Pro) and one-time credit packs purchased on
            autoreels.in, billed through Stripe.
          </p>

          <h2>All sales are final</h2>
          <p>
            We don&apos;t offer refunds on subscription charges or credit pack purchases. Each
            reel you generate has a real, immediate cost — AI voice, image, and script generation
            all happen the moment you hit generate — so once a credit has been spent, or a
            subscription period has started, we can&apos;t reverse that charge.
          </p>

          <h2>Failed generations are automatically refunded</h2>
          <p>
            If a reel fails to generate because of a technical error on our end, the credit it
            would have used is automatically returned to your account — no need to contact us.
            You&apos;ll see this reflected in your credit balance right away.
          </p>

          <h2>Canceling a subscription</h2>
          <p>
            You can cancel your subscription at any time from your billing settings. Cancellation
            stops future renewal charges, but we don&apos;t prorate or refund the current billing
            period — you keep access and any remaining credits until the period you&apos;ve
            already paid for ends.
          </p>

          <h2>Unused credits</h2>
          <p>
            Credit packs don&apos;t expire, and subscription credits don&apos;t roll over between
            billing periods — but in either case, unused credits aren&apos;t refundable for cash.
          </p>

          <h2>Billing problems</h2>
          <p>
            Duplicate charges, a payment that didn&apos;t apply the right plan, or anything that
            looks like an error on our side — email us before opening a chargeback and we&apos;ll
            sort it out directly.
          </p>

          <h2>Contact</h2>
          <p>
            Billing questions: <a href="mailto:ceo@autoreels.in">ceo@autoreels.in</a>.
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
