import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";
import { saveStudent, deleteStudent } from "@/lib/actions/students";
import { PageHeader } from "@/components/page-header";
import { EntityFormDialog, type FieldDef } from "@/components/entity-form-dialog";
import { ConfirmDelete } from "@/components/confirm-delete";
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
import { STUDENT_PREFIXES } from "@/lib/constants";
import { Pencil, Plus } from "lucide-react";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const { class: classFilter } = await searchParams;
  const session = await requireSession();
  const isAdmin = session.user.role === "ADMIN";

  const [students, classes] = await Promise.all([
    prisma.student.findMany({
      where: classFilter ? { classRoomId: classFilter } : undefined,
      include: { classRoom: true },
      orderBy: { studentCode: "asc" },
    }),
    prisma.classRoom.findMany({ orderBy: [{ year: "desc" }, { name: "asc" }] }),
  ]);

  const fields: FieldDef[] = [
    { name: "studentCode", label: "รหัสนักเรียน", required: true },
    {
      name: "prefix",
      label: "คำนำหน้า",
      type: "select",
      required: true,
      options: STUDENT_PREFIXES.map((p) => ({ value: p, label: p })),
    },
    { name: "firstName", label: "ชื่อ", required: true },
    { name: "lastName", label: "นามสกุล", required: true },
    {
      name: "classRoomId",
      label: "ห้องเรียน",
      type: "select",
      options: classes.map((c) => ({
        value: c.id,
        label: `${c.name} (ปี ${c.year})`,
      })),
    },
  ];

  return (
    <>
      <PageHeader
        title="ข้อมูลนักเรียน"
        description={`นักเรียน${classFilter ? "ในห้องที่เลือก" : "ทั้งหมด"} ${students.length} คน`}
      >
        {isAdmin && (
          <EntityFormDialog
            title="เพิ่มข้อมูลนักเรียน"
            fields={fields}
            action={saveStudent.bind(null, null)}
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" /> เพิ่มนักเรียน
              </Button>
            }
          />
        )}
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button asChild variant={!classFilter ? "default" : "outline"} size="sm">
          <Link href="/students">ทุกห้อง</Link>
        </Button>
        {classes.map((c) => (
          <Button
            key={c.id}
            asChild
            variant={classFilter === c.id ? "default" : "outline"}
            size="sm"
          >
            <Link href={`/students?class=${c.id}`}>{c.name}</Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัสนักเรียน</TableHead>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>ห้องเรียน</TableHead>
                {isAdmin && <TableHead className="w-24">จัดการ</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.studentCode}</TableCell>
                  <TableCell className="font-medium">
                    {s.prefix}
                    {s.firstName} {s.lastName}
                  </TableCell>
                  <TableCell>
                    {s.classRoom ? (
                      <Badge variant="secondary">{s.classRoom.name}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex">
                        <EntityFormDialog
                          title="แก้ไขข้อมูลนักเรียน"
                          fields={fields}
                          action={saveStudent.bind(null, s.id)}
                          defaultValues={{
                            studentCode: s.studentCode,
                            prefix: s.prefix,
                            firstName: s.firstName,
                            lastName: s.lastName,
                            classRoomId: s.classRoomId ?? "",
                          }}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <ConfirmDelete
                          action={deleteStudent.bind(null, s.id)}
                          itemLabel={`นักเรียน ${s.firstName} ${s.lastName}`}
                        />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
