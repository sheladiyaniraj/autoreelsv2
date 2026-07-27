import { NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const ref = searchParams.get("ref");
  const source = searchParams.get("source") ?? "direct";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Only Google and magic-link reach this route now, and both can be
      // either a first-time signup or a returning login — created_at vs.
      // "just now" is the only signal available to tell them apart, since
      // Supabase doesn't otherwise flag "this session came from a brand
      // new user."
      const isNewUser = Date.now() - new Date(data.user.created_at).getTime() < 10_000;
      if (isNewUser) {
        if (ref) {
          const admin = createAdminClient();
          await admin.rpc("redeem_referral", {
            p_referred_id: data.user.id,
            p_referral_code: ref,
          });
        }
        await track("signup", { referred: Boolean(ref), source });
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
}
