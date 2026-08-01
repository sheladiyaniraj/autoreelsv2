import { NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifySignup } from "@/lib/slack";

function describeAuthMethod(provider: string | undefined): string {
  if (provider === "google") return "google";
  if (provider === "email") return "magiclink";
  return provider ?? "unknown";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const ref = searchParams.get("ref");
  const source = searchParams.get("source") ?? "direct";
  const country = request.headers.get("x-vercel-ip-country");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const admin = createAdminClient();

      // redeem_referral is idempotent (unique on referred_id), so it's safe
      // to call on every callback that carries a ref — no need to gate it
      // behind "is this a new user," which used to make referred users who
      // took >10s to click their magic link silently miss their bonus.
      if (ref) {
        await admin.rpc("redeem_referral", {
          p_referred_id: data.user.id,
          p_referral_code: ref,
        });
      }

      // Magic-link `created_at` is set when the email is *sent*, not when
      // the link is clicked — clicking almost never happens within 10
      // seconds, so a wall-clock "just now" check silently missed most
      // magic-link signups. Instead, atomically claim notified_at: the
      // first completed callback for this user (whenever that happens)
      // wins the update and is treated as the signup; every later login
      // finds it already set and is a no-op.
      const { data: claimed } = await admin
        .from("users")
        .update({ notified_at: new Date().toISOString() })
        .eq("id", data.user.id)
        .is("notified_at", null)
        .select("id")
        .maybeSingle();
      const isNewUser = Boolean(claimed);

      if (isNewUser) {
        await track("signup", { referred: Boolean(ref), source });
        if (data.user.email) {
          const { count: totalUsers } = await admin
            .from("users")
            .select("id", { count: "exact", head: true });
          await notifySignup({
            email: data.user.email,
            method: describeAuthMethod(data.user.app_metadata?.provider),
            country,
            source,
            totalUsers: totalUsers ?? null,
          });
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
}
