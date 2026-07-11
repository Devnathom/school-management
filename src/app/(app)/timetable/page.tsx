import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";
import {
  saveTimetableEntry,
  deleteTimetableEntry,
} from "@/lib/actions/timetable";
import { PageHeader } from "@/components/page-header";
import { EntityFormDialog, type FieldDef } from "@/components/entity-form-dialog";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DAYS, PERIODS, teacherName } from "@/lib/constants";
import { Plus, Sparkles } from "lucide-react";

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; id?: string }>;
}) {
  const params = await searchParams;
  const session = await requireSession();
  const isAdmin = session.user.role === "ADMIN";

  const [classes, teachers, subjects] = await Promise.all([
    prisma.classRoom.findMany({ orderBy: [{ year: "desc" }, { name: "asc" }] }),
    prisma.teacher.findMany({ orderBy: { firstName: "asc" } }),
    prisma.subject.findMany({ orderBy: { code: "asc" } }),
  ]);

  // ค่าเริ่มต้น: ครูเห็นตารางสอนตนเอง, admin เห็นตารางเรียนห้องแรก
  let view = params.view === "teacher" ? "teacher" : params.view === "class" ? "class" : null;
  let selectedId = params.id ?? null;
  if (!view) {
    if (session.user.teacherId) {
      view = "teacher";
      selectedId = session.user.teacherId;
    } else {
      view = "class";
      selectedId = classes[0]?.id ?? null;
    }
  }
  if (!selectedId) {
    selectedId =
      view === "class" ? (classes[0]?.id ?? null) : (teachers[0]?.id ?? null);
  }

  const entries = selectedId
    ? await prisma.timetableEntry.findMany({
        where:
          view === "class"
            ? { classRoomId: selectedId }
            : { teacherId: selectedId },
        include: { subject: true, teacher: true, classRoom: true },
      })
    : [];

  const byCell = new Map<string, (typeof entries)[number]>();
  for (const e of entries) byCell.set(`${e.dayOfWeek}-${e.period}`, e);

  const addFields: FieldDef[] = [
    {
      name: "classRoomId",
      label: "ห้องเรียน",
      type: "select",
      required: true,
      options: classes.map((c) => ({ value: c.id, label: `${c.name} (ปี ${c.year})` })),
    },
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
      name: "dayOfWeek",
      label: "วัน",
      type: "select",
      required: true,
      options: DAYS.map((d) => ({ value: String(d.value), label: d.label })),
    },
    {
      name: "period",
      label: "คาบที่",
      type: "select",
      required: true,
      options: PERIODS.map((p) => ({ value: String(p), label: `คาบ ${p}` })),
    },
  ];

  const selectedLabel =
    view === "class"
      ? classes.find((c) => c.id === selectedId)?.name
      : teachers.find((t) => t.id === selectedId)
        ? teacherName(teachers.find((t) => t.id === selectedId)!)
        : undefined;

  return (
    <>
      <PageHeader
        title="ตารางเรียน / ตารางสอน"
        description={
          selectedLabel
            ? view === "class"
              ? `ตารางเรียนห้อง ${selectedLabel}`
              : `ตารางสอนของ ${selectedLabel}`
            : "ยังไม่มีข้อมูล"
        }
      >
        {isAdmin && (
          <Button asChild variant="outline" className="gap-2">
            <Link href="/timetable/auto">
              <Sparkles className="size-4" /> จัดตารางอัตโนมัติ
            </Link>
          </Button>
        )}
        {isAdmin && (
          <EntityFormDialog
            title="เพิ่มคาบสอน"
            description="ระบบจะตรวจสอบคาบชนกันให้อัตโนมัติ"
            fields={addFields}
            action={saveTimetableEntry}
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" /> เพิ่มคาบสอน
              </Button>
            }
          />
        )}
      </PageHeader>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          ตารางเรียนรายห้อง:
        </span>
        {classes.map((c) => (
          <Button
            key={c.id}
            asChild
            size="sm"
            variant={view === "class" && selectedId === c.id ? "default" : "outline"}
          >
            <Link href={`/timetable?view=class&id=${c.id}`}>{c.name}</Link>
          </Button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          ตารางสอนรายครู:
        </span>
        {teachers.map((t) => (
          <Button
            key={t.id}
            asChild
            size="sm"
            variant={view === "teacher" && selectedId === t.id ? "default" : "outline"}
          >
            <Link href={`/timetable?view=teacher&id=${t.id}`}>
              {t.firstName}
            </Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">วัน</TableHead>
                {PERIODS.map((p) => (
                  <TableHead key={p} className="text-center">
                    คาบ {p}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {DAYS.map((day) => (
                <TableRow key={day.value}>
                  <TableCell className="font-medium">{day.label}</TableCell>
                  {PERIODS.map((p) => {
                    const entry = byCell.get(`${day.value}-${p}`);
                    return (
                      <TableCell key={p} className="align-top">
                        {entry ? (
                          <div className="group relative rounded-md border bg-primary/5 p-2 text-xs">
                            <p className="font-semibold">{entry.subject.code}</p>
                            <p className="text-muted-foreground">
                              {entry.subject.name}
                            </p>
                            <p className="mt-1">
                              {view === "class"
                                ? `${entry.teacher.prefix}${entry.teacher.firstName}`
                                : `ห้อง ${entry.classRoom.name}`}
                            </p>
                            {isAdmin && (
                              <div className="absolute -right-1 -top-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <ConfirmDelete
                                  action={deleteTimetableEntry.bind(null, entry.id)}
                                  itemLabel={`คาบ ${entry.subject.name} (${day.label} คาบ ${p})`}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-14 rounded-md border border-dashed border-muted" />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
