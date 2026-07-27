import Link from "next/link";
import { headers } from "next/headers";
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
import { signInWithGoogle, signUpWithPassword } from "@/lib/actions/auth";
import { extractSignupSource } from "@/lib/site";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ref?: string }>;
}) {
  const { error, ref } = await searchParams;
  // Captured here (page load, when the Referer header still points at
  // whichever page the visitor actually clicked "Sign up" from) and
  // threaded through as a hidden field, since by the time the form POSTs
  // as a Server Action the Referer would just say "/signup" itself.
  const refererHeader = (await headers()).get("referer");
  console.log("[signup debug] raw referer header:", refererHeader);
  const signupSource = extractSignupSource(refererHeader);

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
          <form action={signUpWithPassword} className="space-y-4">
            {ref && <input type="hidden" name="ref" value={ref} />}
            <input type="hidden" name="signup_source" value={signupSource} />
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
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Sign up
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
