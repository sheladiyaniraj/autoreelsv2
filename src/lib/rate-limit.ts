import { createAdminClient } from "@/lib/supabase/admin";

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

// Abuse-prevention rate limiting for unauthenticated, AI-cost-incurring
// tool endpoints (src/app/tools/*). Not a hard security boundary — a
// count-then-insert race under concurrent requests could let a couple of
// extra calls through — just enough friction to stop casual scripted abuse
// without needing a separate Redis/KV service.
export async function checkRateLimit(
  ip: string,
  tool: string,
  limit: number,
  windowMinutes: number
): Promise<boolean> {
  const admin = createAdminClient();
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { count } = await admin
    .from("tool_usage")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .eq("tool", tool)
    .gte("created_at", windowStart);

  if ((count ?? 0) >= limit) {
    return false;
  }

  await admin.from("tool_usage").insert({ ip_address: ip, tool });
  return true;
}
