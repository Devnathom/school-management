import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";
import { saveClassRoom, deleteClassRoom } from "@/lib/actions/classes";
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
import { teacherName } from "@/lib/constants";
import { Pencil, Plus } from "lucide-react";

export default async function ClassesPage() {
  const session = await requireSession();
  const isAdmin = session.user.role === "ADMIN";

  const [classes, teachers] = await Promise.all([
    prisma.classRoom.findMany({
      include: {
        homeroomTeacher: true,
        _count: { select: { students: true } },
      },
      orderBy: [{ year: "desc" }, { name: "asc" }],
    }),
    prisma.teacher.findMany({ orderBy: { firstName: "asc" } }),
  ]);

  const fields: FieldDef[] = [
    { name: "name", label: "ชื่อห้อง", required: true, placeholder: "เช่น ม.1/1" },
    { name: "year", label: "ปีการศึกษา", required: true, placeholder: "เช่น 2569" },
    {
      name: "homeroomTeacherId",
      label: "ครูประจำชั้น",
      type: "select",
      options: teachers.map((t) => ({ value: t.id, label: teacherName(t) })),
    },
  ];

  return (
    <>
      <PageHeader title="ห้องเรียน" description={`ทั้งหมด ${classes.length} ห้อง`}>
        {isAdmin && (
          <EntityFormDialog
            title="เพิ่มห้องเรียน"
            fields={fields}
            action={saveClassRoom.bind(null, null)}
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" /> เพิ่มห้องเรียน
              </Button>
            }
          />
        )}
      </PageHeader>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อห้อง</TableHead>
                <TableHead>ปีการศึกษา</TableHead>
                <TableHead>ครูประจำชั้น</TableHead>
                <TableHead>จำนวนนักเรียน</TableHead>
                {isAdmin && <TableHead className="w-24">จัดการ</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.year}</TableCell>
                  <TableCell>
                    {c.homeroomTeacher ? teacherName(c.homeroomTeacher) : "-"}
                  </TableCell>
                  <TableCell>{c._count.students} คน</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex">
                        <EntityFormDialog
                          title="แก้ไขห้องเรียน"
                          fields={fields}
                          action={saveClassRoom.bind(null, c.id)}
                          defaultValues={{
                            name: c.name,
                            year: c.year,
                            homeroomTeacherId: c.homeroomTeacherId ?? "",
                          }}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <ConfirmDelete
                          action={deleteClassRoom.bind(null, c.id)}
                          itemLabel={`ห้องเรียน ${c.name}`}
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
