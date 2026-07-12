"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  BookOpen,
  CalendarDays,
  ChevronsUp,
  Package,
  Inbox,
  Send,
  Megaphone,
} from "lucide-react";

const groups = [
  {
    label: "ภาพรวม",
    items: [{ href: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard }],
  },
  {
    label: "ข้อมูลพื้นฐาน",
    items: [
      { href: "/teachers", label: "ข้อมูลครู", icon: Users },
      { href: "/students", label: "ข้อมูลนักเรียน", icon: GraduationCap },
      { href: "/classes", label: "ห้องเรียน", icon: School },
      { href: "/subjects", label: "รายวิชา", icon: BookOpen },
      { href: "/promotion", label: "เลื่อนชั้นเรียน", icon: ChevronsUp },
    ],
  },
  {
    label: "วิชาการ",
    items: [
      { href: "/timetable", label: "ตารางเรียน/ตารางสอน", icon: CalendarDays },
    ],
  },
  {
    label: "งานสำนักงาน",
    items: [
      { href: "/inventory", label: "งานพัสดุ", icon: Package },
      { href: "/documents/incoming", label: "ทะเบียนหนังสือรับ", icon: Inbox },
      { href: "/documents/outgoing", label: "ทะเบียนหนังสือส่ง", icon: Send },
      { href: "/documents/circulars", label: "จดหมายเวียน", icon: Megaphone },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-muted"
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
