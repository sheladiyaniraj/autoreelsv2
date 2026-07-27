import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail } from "lucide-react";
import {
  signInWithGoogle,
  signInWithMagicLink,
  signInWithPassword,
} from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; magicSent?: string }>;
}) {
  const { error, magicSent } = await searchParams;

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Log in to AutoReels</CardTitle>
          <CardDescription>
            Turn any topic into a faceless reel in minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {magicSent && (
            <p className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
              <Mail className="size-4 shrink-0 text-primary" />
              Check <strong className="text-foreground">{magicSent}</strong> for a sign-in link.
            </p>
          )}
          <form action={signInWithGoogle}>
            <Button type="submit" variant="outline" className="w-full">
              Continue with Google
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>
          <form action={signInWithMagicLink} className="flex gap-2">
            <input type="hidden" name="page" value="login" />
            <Input
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Button type="submit" variant="outline" className="shrink-0">
              Send link
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or use a password
              </span>
            </div>
          </div>
          <form action={signInWithPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Log in
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Don&apos;t have an account?&nbsp;
          <Link href="/signup" className="text-foreground underline">
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
