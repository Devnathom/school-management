import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";
import { PageHeader } from "@/components/page-header";
import { PromoteRow } from "./promote-row";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

export default async function PromotionPage() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [classes, unassigned] = await Promise.all([
    prisma.classRoom.findMany({
      include: { _count: { select: { students: true } } },
      orderBy: [{ year: "desc" }, { name: "asc" }],
    }),
    prisma.student.count({ where: { classRoomId: null } }),
  ]);

  return (
    <>
      <PageHeader
        title="เลื่อนชั้นเรียน"
        description="ย้ายนักเรียนทั้งห้องไปห้องใหม่เมื่อขึ้นปีการศึกษา หรือนำออกเมื่อจบการศึกษา"
      >
        <Button asChild variant="outline" className="gap-2">
          <Link href="/classes">
            <Plus className="size-4" /> สร้างห้องเรียนปีใหม่ก่อน
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ห้องต้นทาง</TableHead>
                <TableHead>ปีการศึกษา</TableHead>
                <TableHead>นักเรียน</TableHead>
                <TableHead>ย้ายไปยัง</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => {
                const targets = [
                  ...classes
                    .filter((t) => t.id !== c.id)
                    .map((t) => ({
                      value: t.id,
                      label: `${t.name} (ปี ${t.year})`,
                    })),
                  { value: "GRADUATE", label: "— จบการศึกษา (นำออกจากห้อง) —" },
                ];
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.year}</TableCell>
                    <TableCell>
                      <Badge variant={c._count.students > 0 ? "secondary" : "outline"}>
                        {c._count.students} คน
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <PromoteRow
                        sourceId={c.id}
                        studentCount={c._count.students}
                        targets={targets}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {unassigned > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              นักเรียนที่ไม่มีห้องเรียน (จบการศึกษา/รอจัดห้อง): {unassigned} คน —
              ดูได้ที่หน้า{" "}
              <Link href="/students" className="underline">
                ข้อมูลนักเรียน
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
