"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function buildCallbackUrl(origin: string, formData: FormData): string {
  const ref = formData.get("ref");
  const signupSource = String(formData.get("signup_source") ?? "direct");
  const url = new URL(`${origin}/auth/callback`);
  if (ref) url.searchParams.set("ref", String(ref));
  url.searchParams.set("source", signupSource);
  return url.toString();
}

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const page = formData.get("page") === "signup" ? "/signup" : "/login";
  const origin = (await headers()).get("origin") ?? "";

  const supabase = await createClient();
  // signInWithOtp creates the user automatically if they don't exist yet,
  // so this one flow covers both first-time signup and returning login —
  // no separate "magic link signup" action needed.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: buildCallbackUrl(origin, formData) },
  });

  if (error) {
    redirect(`${page}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`${page}?magicSent=${encodeURIComponent(email)}`);
}

export async function signInWithGoogle(formData: FormData) {
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: buildCallbackUrl(origin, formData) },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
