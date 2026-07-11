import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";
import { saveTeacher, deleteTeacher } from "@/lib/actions/teachers";
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
import { DEPARTMENTS, TEACHER_PREFIXES } from "@/lib/constants";
import { Pencil, Plus } from "lucide-react";

function teacherFields(): FieldDef[] {
  return [
    {
      name: "prefix",
      label: "คำนำหน้า",
      type: "select",
      required: true,
      options: TEACHER_PREFIXES.map((p) => ({ value: p, label: p })),
    },
    { name: "firstName", label: "ชื่อ", required: true },
    { name: "lastName", label: "นามสกุล", required: true },
    { name: "position", label: "ตำแหน่ง", placeholder: "เช่น ครูชำนาญการ" },
    {
      name: "department",
      label: "กลุ่มสาระการเรียนรู้",
      type: "select",
      options: DEPARTMENTS.map((d) => ({ value: d, label: d })),
    },
    { name: "phone", label: "เบอร์โทรศัพท์" },
    { name: "email", label: "อีเมล" },
  ];
}

export default async function TeachersPage() {
  const session = await requireSession();
  const isAdmin = session.user.role === "ADMIN";
  const teachers = await prisma.teacher.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <PageHeader title="ข้อมูลครู" description={`ครูทั้งหมด ${teachers.length} คน`}>
        {isAdmin && (
          <EntityFormDialog
            title="เพิ่มข้อมูลครู"
            fields={teacherFields()}
            action={saveTeacher.bind(null, null)}
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" /> เพิ่มครู
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
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead>กลุ่มสาระ</TableHead>
                <TableHead>เบอร์โทร</TableHead>
                <TableHead>อีเมล</TableHead>
                {isAdmin && <TableHead className="w-24">จัดการ</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    {t.prefix}
                    {t.firstName} {t.lastName}
                  </TableCell>
                  <TableCell>{t.position ?? "-"}</TableCell>
                  <TableCell>{t.department ?? "-"}</TableCell>
                  <TableCell>{t.phone ?? "-"}</TableCell>
                  <TableCell>{t.email ?? "-"}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex">
                        <EntityFormDialog
                          title="แก้ไขข้อมูลครู"
                          fields={teacherFields()}
                          action={saveTeacher.bind(null, t.id)}
                          defaultValues={{
                            prefix: t.prefix,
                            firstName: t.firstName,
                            lastName: t.lastName,
                            position: t.position ?? "",
                            department: t.department ?? "",
                            phone: t.phone ?? "",
                            email: t.email ?? "",
                          }}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <ConfirmDelete
                          action={deleteTeacher.bind(null, t.id)}
                          itemLabel={`ครู ${t.firstName} ${t.lastName}`}
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
