import Link from "next/link";
import { cookies, headers } from "next/headers";
import { Mail } from "lucide-react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInWithGoogle, signInWithMagicLink } from "@/lib/actions/auth";
import { extractSignupSource, SIGNUP_SOURCE_COOKIE } from "@/lib/site";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ref?: string; magicSent?: string }>;
}) {
  const { error, ref, magicSent } = await searchParams;
  // Prefer the first-touch source captured in proxy.ts when the visitor
  // first arrived (e.g. "chatgpt.com"), since by now the Referer header
  // only points at whichever internal page they clicked "Sign up" from.
  // Falls back to that immediate Referer when the cookie isn't set (e.g.
  // cookies blocked, or this *is* the first-touch page and proxy hasn't
  // had a chance to round-trip a Set-Cookie back to the browser yet).
  const firstTouchSource = (await cookies()).get(SIGNUP_SOURCE_COOKIE)?.value;
  const refererHeader = (await headers()).get("referer");
  const signupSource = firstTouchSource ?? extractSignupSource(refererHeader);

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            {ref
              ? "Get 3 free reels, plus 2 bonus credits for using a referral link."
              : "Get 3 free reels, no card required."}
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
            {ref && <input type="hidden" name="ref" value={ref} />}
            <input type="hidden" name="signup_source" value={signupSource} />
            <Button type="submit" variant="outline" className="w-full">
              <GoogleIcon className="size-4" />
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
            <input type="hidden" name="page" value="signup" />
            {ref && <input type="hidden" name="ref" value={ref} />}
            <input type="hidden" name="signup_source" value={signupSource} />
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
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Already have an account?&nbsp;
          <Link href="/login" className="text-foreground underline">
            Log in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
