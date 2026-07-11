import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  School,
  Inbox,
  PackageMinus,
  Megaphone,
} from "lucide-react";

export default async function DashboardPage() {
  const [
    teacherCount,
    studentCount,
    classCount,
    pendingIncoming,
    allItems,
    latestCirculars,
  ] = await Promise.all([
    prisma.teacher.count(),
    prisma.student.count(),
    prisma.classRoom.count(),
    prisma.incomingDocument.count({ where: { status: "PENDING" } }),
    prisma.inventoryItem.findMany(),
    prisma.circular.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { _count: { select: { acks: true } } },
    }),
  ]);

  const lowStock = allItems.filter((i) => i.quantity < i.minStock);

  const stats = [
    { label: "ครูทั้งหมด", value: teacherCount, unit: "คน", icon: Users, href: "/teachers" },
    { label: "นักเรียนทั้งหมด", value: studentCount, unit: "คน", icon: GraduationCap, href: "/students" },
    { label: "ห้องเรียน", value: classCount, unit: "ห้อง", icon: School, href: "/classes" },
    { label: "หนังสือรับรอดำเนินการ", value: pendingIncoming, unit: "ฉบับ", icon: Inbox, href: "/documents/incoming" },
  ];

  return (
    <>
      <PageHeader
        title="แดชบอร์ด"
        description="ภาพรวมข้อมูลโรงเรียน"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold leading-none">
                    {s.value}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      {s.unit}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <PackageMinus className="size-5 text-destructive" />
            <CardTitle className="text-base">พัสดุต่ำกว่าจุดสั่งซื้อ</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                ไม่มีพัสดุต่ำกว่าจุดสั่งซื้อ
              </p>
            ) : (
              <ul className="space-y-2">
                {lowStock.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {item.name}{" "}
                      <span className="text-muted-foreground">({item.code})</span>
                    </span>
                    <Badge variant="destructive">
                      เหลือ {item.quantity} / ขั้นต่ำ {item.minStock} {item.unit}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Megaphone className="size-5 text-primary" />
            <CardTitle className="text-base">จดหมายเวียนล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            {latestCirculars.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มีจดหมายเวียน</p>
            ) : (
              <ul className="space-y-3">
                {latestCirculars.map((c) => (
                  <li key={c.id}>
                    <Link
                      href="/documents/circulars"
                      className="text-sm font-medium hover:underline"
                    >
                      {c.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      รับทราบแล้ว {c._count.acks} คน ·{" "}
                      {new Date(c.createdAt).toLocaleDateString("th-TH", {
                        dateStyle: "long",
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
