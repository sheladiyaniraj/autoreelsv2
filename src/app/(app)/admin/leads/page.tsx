import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTool } from "@/content/tools";

export default async function AdminLeadsPage() {
  const adminUser = await requireAdminUser();
  if (!adminUser) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  const { data: leads } = await admin
    .from("email_leads")
    .select("id, email, source_tool, created_at")
    .order("created_at", { ascending: false });

  const byTool = new Map<string, number>();
  for (const lead of leads ?? []) {
    byTool.set(lead.source_tool, (byTool.get(lead.source_tool) ?? 0) + 1);
  }
  const toolBreakdown = [...byTool.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" nativeButton={false} render={<Link href="/admin" />}>
        <ArrowLeft className="size-4" />
        Back to overview
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Free tool leads</h1>
        <p className="text-muted-foreground">
          {leads?.length ?? 0} email{leads?.length === 1 ? "" : "s"} captured from the free
          tools — not yet emailed anywhere.
        </p>
      </div>

      {toolBreakdown.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {toolBreakdown.map(([tool, count]) => (
            <Card key={tool}>
              <CardHeader className="pb-2">
                <CardDescription>{getTool(tool)?.name ?? tool}</CardDescription>
                <CardTitle className="text-3xl">{count}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="divide-y p-0">
          {(leads ?? []).length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No leads captured yet.</p>
          )}
          {(leads ?? []).map((lead) => (
            <div key={lead.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <Mail className="size-4 text-muted-foreground" />
              <p className="min-w-48 flex-1 font-medium">{lead.email}</p>
              <p className="text-xs text-muted-foreground">
                {getTool(lead.source_tool)?.name ?? lead.source_tool}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(lead.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
