import { requireSession } from "@/lib/guard";
import { signOut } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, LogOut } from "lucide-react";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  const { user } = session;
  const isAdmin = user.role === "ADMIN";

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar เฉพาะจอ md ขึ้นไป */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">ระบบบริหารโรงเรียน</p>
            <p className="text-xs text-muted-foreground">School Management</p>
          </div>
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav />
        </div>
        <Separator />
        <div className="p-3">
          <div className="mb-2 px-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? "ผู้ดูแลระบบ" : "ครู"}
            </Badge>
          </div>
          <form action={doSignOut}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <LogOut className="size-4" />
              ออกจากระบบ
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:ml-64">
        {/* แถบบนเฉพาะจอเล็ก */}
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background px-3 py-2 md:hidden">
          <MobileNav
            userName={user.name ?? ""}
            isAdmin={isAdmin}
            signOutAction={doSignOut}
          />
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </span>
            <span className="text-sm font-semibold">ระบบบริหารโรงเรียน</span>
          </div>
        </header>

        <main className="flex-1 bg-muted/30 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
