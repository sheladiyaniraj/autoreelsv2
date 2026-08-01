import Link from "next/link";
import { Clapperboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Clapperboard className="size-5 text-primary" />
          AutoReels
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/tools" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
            Free Tools
          </Link>
          <Link href="/ideas" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
            Reel Ideas
          </Link>
          <Button size="sm" nativeButton={false} render={<Link href="/signup" />}>
            <Sparkles className="size-4" />
            Get 3 free reels
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">{children}</main>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <div className="mb-3 flex justify-center gap-6">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <Link href="/tools" className="hover:text-foreground">
            Free Tools
          </Link>
          <Link href="/ideas" className="hover:text-foreground">
            Reel Ideas
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
