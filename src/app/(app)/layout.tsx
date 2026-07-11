import { requireSession } from "@/lib/guard";
import { signOut } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, LogOut } from "lucide-react";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  const { user } = session;

  return (
    <div className="flex min-h-screen w-full">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r bg-background">
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
            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
              {user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "ครู"}
            </Badge>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
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
      <main className="ml-64 flex-1 bg-muted/30 p-6">{children}</main>
    </div>
  );
}
