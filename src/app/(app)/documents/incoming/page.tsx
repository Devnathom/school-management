import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";
import { saveIncoming, deleteIncoming } from "@/lib/actions/documents";
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
import { thaiDate } from "@/lib/constants";
import { Pencil, Plus } from "lucide-react";

function toDateInput(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

function incomingFields(withStatus: boolean): FieldDef[] {
  const fields: FieldDef[] = [
    { name: "docNo", label: "ที่หนังสือ", required: true, placeholder: "เช่น ศธ 04001/ว123" },
    { name: "docDate", label: "ลงวันที่", type: "date", required: true },
    { name: "fromOrg", label: "จากหน่วยงาน", required: true },
    { name: "subject", label: "เรื่อง", required: true },
    { name: "action", label: "การปฏิบัติ", placeholder: "เช่น แจ้งผู้เกี่ยวข้อง" },
  ];
  if (withStatus) {
    fields.push({
      name: "status",
      label: "สถานะ",
      type: "select",
      options: [
        { value: "PENDING", label: "รอดำเนินการ" },
        { value: "DONE", label: "เสร็จสิ้น" },
      ],
    });
  }
  return fields;
}

export default async function IncomingPage() {
  const session = await requireSession();
  const isAdmin = session.user.role === "ADMIN";
  const docs = await prisma.incomingDocument.findMany({
    orderBy: [{ year: "desc" }, { regNo: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="ทะเบียนหนังสือรับ"
        description="ระบบออกเลขทะเบียนรับต่อเนื่องภายในปีให้อัตโนมัติ"
      >
        {isAdmin && (
          <EntityFormDialog
            title="ลงทะเบียนหนังสือรับ"
            fields={incomingFields(false)}
            action={saveIncoming.bind(null, null)}
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" /> ลงทะเบียนรับ
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
                <TableHead>เลขทะเบียนรับ</TableHead>
                <TableHead>ที่หนังสือ</TableHead>
                <TableHead>ลงวันที่</TableHead>
                <TableHead>จากหน่วยงาน</TableHead>
                <TableHead>เรื่อง</TableHead>
                <TableHead>การปฏิบัติ</TableHead>
                <TableHead>สถานะ</TableHead>
                {isAdmin && <TableHead className="w-24">จัดการ</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    {d.regNo}/{d.year}
                  </TableCell>
                  <TableCell>{d.docNo}</TableCell>
                  <TableCell>{thaiDate(d.docDate)}</TableCell>
                  <TableCell>{d.fromOrg}</TableCell>
                  <TableCell className="max-w-64">{d.subject}</TableCell>
                  <TableCell>{d.action || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === "DONE" ? "secondary" : "destructive"}>
                      {d.status === "DONE" ? "เสร็จสิ้น" : "รอดำเนินการ"}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex">
                        <EntityFormDialog
                          title={`แก้ไขหนังสือรับ เลขที่ ${d.regNo}/${d.year}`}
                          fields={incomingFields(true)}
                          action={saveIncoming.bind(null, d.id)}
                          defaultValues={{
                            docNo: d.docNo,
                            docDate: toDateInput(d.docDate),
                            fromOrg: d.fromOrg,
                            subject: d.subject,
                            action: d.action ?? "",
                            status: d.status,
                          }}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <ConfirmDelete
                          action={deleteIncoming.bind(null, d.id)}
                          itemLabel={`หนังสือรับเลขที่ ${d.regNo}/${d.year}`}
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
