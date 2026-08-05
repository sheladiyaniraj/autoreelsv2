import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { AdminUsersTable } from "@/components/admin-users-table";

export default async function AdminUsersPage() {
  const adminUser = await requireAdminUser();
  if (!adminUser) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  const { data: users } = await admin
    .from("users_admin")
    .select("id, email, plan, credits, is_admin, banned, created_at, country, claimed")
    .order("created_at", { ascending: false });

  const activeCount = users?.filter((u) => u.claimed).length ?? 0;
  const importedCount = (users?.length ?? 0) - activeCount;

  return (
    <div className="space-y-6">
      <Button variant="ghost" nativeButton={false} render={<Link href="/admin" />}>
        <ArrowLeft className="size-4" />
        Back to overview
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-muted-foreground">
          {users?.length ?? 0} total: {activeCount} active, {importedCount} imported (not yet
          signed in). Grant credits or suspend an account.
        </p>
      </div>

      <AdminUsersTable users={users ?? []} currentUserId={adminUser.id} />
    </div>
  );
}
