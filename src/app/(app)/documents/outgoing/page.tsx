import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";
import { saveOutgoing, deleteOutgoing } from "@/lib/actions/documents";
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
import { thaiDate } from "@/lib/constants";
import { Pencil, Plus } from "lucide-react";

function toDateInput(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

const fields: FieldDef[] = [
  { name: "toOrg", label: "ถึงหน่วยงาน", required: true },
  { name: "subject", label: "เรื่อง", required: true },
  { name: "docDate", label: "วันที่", type: "date", required: true },
  { name: "note", label: "หมายเหตุ" },
];

export default async function OutgoingPage() {
  const session = await requireSession();
  const isAdmin = session.user.role === "ADMIN";
  const docs = await prisma.outgoingDocument.findMany({
    orderBy: [{ year: "desc" }, { regNo: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="ทะเบียนหนังสือส่ง"
        description="ระบบออกเลขที่หนังสือส่งต่อเนื่องภายในปีให้อัตโนมัติ"
      >
        {isAdmin && (
          <EntityFormDialog
            title="ลงทะเบียนหนังสือส่ง"
            fields={fields}
            action={saveOutgoing.bind(null, null)}
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" /> ลงทะเบียนส่ง
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
                <TableHead>เลขที่หนังสือ</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>ถึงหน่วยงาน</TableHead>
                <TableHead>เรื่อง</TableHead>
                <TableHead>หมายเหตุ</TableHead>
                {isAdmin && <TableHead className="w-24">จัดการ</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    {d.regNo}/{d.year}
                  </TableCell>
                  <TableCell>{thaiDate(d.docDate)}</TableCell>
                  <TableCell>{d.toOrg}</TableCell>
                  <TableCell className="max-w-72">{d.subject}</TableCell>
                  <TableCell>{d.note || "-"}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex">
                        <EntityFormDialog
                          title={`แก้ไขหนังสือส่ง เลขที่ ${d.regNo}/${d.year}`}
                          fields={fields}
                          action={saveOutgoing.bind(null, d.id)}
                          defaultValues={{
                            toOrg: d.toOrg,
                            subject: d.subject,
                            docDate: toDateInput(d.docDate),
                            note: d.note ?? "",
                          }}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <ConfirmDelete
                          action={deleteOutgoing.bind(null, d.id)}
                          itemLabel={`หนังสือส่งเลขที่ ${d.regNo}/${d.year}`}
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
