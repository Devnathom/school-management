import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";
import { saveSubject, deleteSubject } from "@/lib/actions/subjects";
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
import { DEPARTMENTS } from "@/lib/constants";
import { Pencil, Plus } from "lucide-react";

const fields: FieldDef[] = [
  { name: "code", label: "รหัสวิชา", required: true, placeholder: "เช่น ค21101" },
  { name: "name", label: "ชื่อวิชา", required: true },
  {
    name: "department",
    label: "กลุ่มสาระการเรียนรู้",
    type: "select",
    options: DEPARTMENTS.map((d) => ({ value: d, label: d })),
  },
];

export default async function SubjectsPage() {
  const session = await requireSession();
  const isAdmin = session.user.role === "ADMIN";
  const subjects = await prisma.subject.findMany({ orderBy: { code: "asc" } });

  return (
    <>
      <PageHeader title="รายวิชา" description={`ทั้งหมด ${subjects.length} วิชา`}>
        {isAdmin && (
          <EntityFormDialog
            title="เพิ่มรายวิชา"
            fields={fields}
            action={saveSubject.bind(null, null)}
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" /> เพิ่มรายวิชา
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
                <TableHead>รหัสวิชา</TableHead>
                <TableHead>ชื่อวิชา</TableHead>
                <TableHead>กลุ่มสาระ</TableHead>
                {isAdmin && <TableHead className="w-24">จัดการ</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.code}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.department ?? "-"}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex">
                        <EntityFormDialog
                          title="แก้ไขรายวิชา"
                          fields={fields}
                          action={saveSubject.bind(null, s.id)}
                          defaultValues={{
                            code: s.code,
                            name: s.name,
                            department: s.department ?? "",
                          }}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <ConfirmDelete
                          action={deleteSubject.bind(null, s.id)}
                          itemLabel={`วิชา ${s.name}`}
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
