import { NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { TOOLS } from "@/content/tools";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_TOOLS = new Set(TOOLS.map((t) => t.slug));

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip, "subscribe", 10, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests, try again in a bit." },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string; tool?: string };
  const email = body.email?.trim().toLowerCase();
  const tool = body.tool && VALID_TOOLS.has(body.tool) ? body.tool : "unknown";

  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("email_leads").insert({ email, source_tool: tool });

  if (error) {
    return NextResponse.json({ error: "Couldn't save that, try again" }, { status: 500 });
  }

  await track("email_captured", { tool });

  return NextResponse.json({ ok: true });
}
