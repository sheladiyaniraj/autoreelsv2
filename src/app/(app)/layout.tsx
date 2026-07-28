import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Clapperboard,
  CreditCard,
  LayoutDashboard,
  Library,
  Plus,
  ShieldCheck,
  Video,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "@/lib/actions/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("credits, plan, email, is_admin, banned")
    .eq("id", user.id)
    .single();

  if (profile?.banned) {
    await supabase.auth.signOut();
    redirect("/login?error=Your%20account%20has%20been%20suspended");
  }

  const initials = (profile?.email ?? user.email ?? "?")
    .slice(0, 2)
    .toUpperCase();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/create", label: "Create Reel", icon: Plus },
    { href: "/talking-head", label: "Talking-Head Editor", icon: Video },
    { href: "/library", label: "Library", icon: Library },
    { href: "/billing", label: "Billing", icon: CreditCard },
    ...(profile?.is_admin ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-60 flex-col border-r bg-sidebar p-4 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <Clapperboard className="size-6 text-primary" />
          <span className="text-lg font-semibold">AutoReels</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <div className="flex items-center gap-2 md:hidden">
            <Clapperboard className="size-5 text-primary" />
            <span className="font-semibold">AutoReels</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Badge variant="secondary" className="gap-1">
              {profile?.credits ?? 0} credits
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger render={<button className="outline-none" />}>
                <Avatar className="size-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="opacity-100">
                  {profile?.email ?? user.email}
                </DropdownMenuItem>
                <form action={signOut}>
                  <DropdownMenuItem
                    render={<button type="submit" className="w-full text-left" />}
                  >
                    Sign out
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  );
}
