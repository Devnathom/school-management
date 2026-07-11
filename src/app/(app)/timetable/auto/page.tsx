import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";
import { saveAssignment, deleteAssignment } from "@/lib/actions/assignments";
import { PageHeader } from "@/components/page-header";
import { EntityFormDialog, type FieldDef } from "@/components/entity-form-dialog";
import { ConfirmDelete } from "@/components/confirm-delete";
import { AutoScheduleButton } from "./auto-schedule-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { teacherName } from "@/lib/constants";
import { ArrowLeft, Pencil, Plus } from "lucide-react";

const MAX_PER_WEEK = 40; // 5 วัน × 8 คาบ

export default async function AutoTimetablePage() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect("/timetable");

  const [classes, teachers, subjects] = await Promise.all([
    prisma.classRoom.findMany({
      include: {
        assignments: { include: { subject: true, teacher: true } },
      },
      orderBy: [{ year: "desc" }, { name: "asc" }],
    }),
    prisma.teacher.findMany({ orderBy: { firstName: "asc" } }),
    prisma.subject.findMany({ orderBy: { code: "asc" } }),
  ]);

  const assignmentFields: FieldDef[] = [
    {
      name: "subjectId",
      label: "รายวิชา",
      type: "select",
      required: true,
      options: subjects.map((s) => ({ value: s.id, label: `${s.code} ${s.name}` })),
    },
    {
      name: "teacherId",
      label: "ครูผู้สอน",
      type: "select",
      required: true,
      options: teachers.map((t) => ({ value: t.id, label: teacherName(t) })),
    },
    {
      name: "periodsPerWeek",
      label: "จำนวนคาบ/สัปดาห์",
      type: "select",
      required: true,
      options: [1, 2, 3, 4, 5, 6].map((n) => ({
        value: String(n),
        label: `${n} คาบ/สัปดาห์`,
      })),
    },
  ];

  // สรุปภาระงานสอนของครูแต่ละคน
  const teacherLoad = new Map<string, number>();
  for (const c of classes) {
    for (const a of c.assignments) {
      teacherLoad.set(
        a.teacherId,
        (teacherLoad.get(a.teacherId) ?? 0) + a.periodsPerWeek
      );
    }
  }

  return (
    <>
      <PageHeader
        title="จัดตารางอัตโนมัติ"
        description="กำหนดมอบหมายการสอนของแต่ละห้อง แล้วให้ระบบจัดตารางให้โดยไม่มีคาบชนกัน"
      >
        <Button asChild variant="outline" className="gap-2">
          <Link href="/timetable">
            <ArrowLeft className="size-4" /> กลับไปดูตาราง
          </Link>
        </Button>
        <AutoScheduleButton />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        {classes.map((c) => {
          const total = c.assignments.reduce(
            (sum, a) => sum + a.periodsPerWeek,
            0
          );
          return (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {c.name}{" "}
                      <span className="font-normal text-muted-foreground">
                        (ปี {c.year})
                      </span>
                    </CardTitle>
                    <CardDescription>
                      รวม {total}/{MAX_PER_WEEK} คาบ/สัปดาห์
                      {total > MAX_PER_WEEK && " — เกินช่องตาราง!"}
                    </CardDescription>
                  </div>
                  <EntityFormDialog
                    title={`มอบหมายการสอน ห้อง ${c.name}`}
                    fields={assignmentFields}
                    action={saveAssignment.bind(null, c.id, null)}
                    trigger={
                      <Button size="sm" variant="outline" className="gap-1">
                        <Plus className="size-3.5" /> เพิ่มวิชา
                      </Button>
                    }
                  />
                </div>
              </CardHeader>
              <CardContent>
                {c.assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    ยังไม่มีการมอบหมายวิชาให้ห้องนี้
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>วิชา</TableHead>
                        <TableHead>ครูผู้สอน</TableHead>
                        <TableHead>คาบ/สัปดาห์</TableHead>
                        <TableHead className="w-20" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {c.assignments.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>
                            {a.subject.code} {a.subject.name}
                          </TableCell>
                          <TableCell>{teacherName(a.teacher)}</TableCell>
                          <TableCell>{a.periodsPerWeek}</TableCell>
                          <TableCell>
                            <div className="flex">
                              <EntityFormDialog
                                title={`แก้ไข: ${a.subject.name} (${c.name})`}
                                fields={assignmentFields}
                                action={saveAssignment.bind(null, c.id, a.id)}
                                defaultValues={{
                                  subjectId: a.subjectId,
                                  teacherId: a.teacherId,
                                  periodsPerWeek: String(a.periodsPerWeek),
                                }}
                                trigger={
                                  <Button variant="ghost" size="icon">
                                    <Pencil className="size-4" />
                                  </Button>
                                }
                              />
                              <ConfirmDelete
                                action={deleteAssignment.bind(null, a.id)}
                                itemLabel={`มอบหมายวิชา ${a.subject.name} ห้อง ${c.name}`}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">ภาระงานสอนรวมของครู</CardTitle>
          <CardDescription>
            คาบ/สัปดาห์ทั้งหมดที่ครูแต่ละคนได้รับมอบหมาย (เต็มที่ {MAX_PER_WEEK} คาบ)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {teachers.map((t) => {
              const load = teacherLoad.get(t.id) ?? 0;
              return (
                <Badge
                  key={t.id}
                  variant={
                    load > MAX_PER_WEEK
                      ? "destructive"
                      : load > 0
                        ? "secondary"
                        : "outline"
                  }
                >
                  {teacherName(t)}: {load} คาบ
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
