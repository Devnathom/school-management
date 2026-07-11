"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { GraduationCap, LogOut, Menu } from "lucide-react";

export function MobileNav({
  userName,
  isAdmin,
  signOutAction,
}: {
  userName: string;
  isAdmin: boolean;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // ปิดเมนูอัตโนมัติเมื่อเปลี่ยนหน้า
  useEffect(() => setOpen(false), [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="เปิดเมนู">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2 text-left">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </span>
            ระบบบริหารโรงเรียน
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav />
        </div>
        <div className="border-t p-3">
          <div className="mb-2 px-1">
            <p className="truncate text-sm font-medium">{userName}</p>
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? "ผู้ดูแลระบบ" : "ครู"}
            </Badge>
          </div>
          <form action={signOutAction}>
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
      </SheetContent>
    </Sheet>
  );
}
