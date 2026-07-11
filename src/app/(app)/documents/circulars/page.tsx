import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";
import { saveCircular, deleteCircular } from "@/lib/actions/documents";
import { PageHeader } from "@/components/page-header";
import { EntityFormDialog, type FieldDef } from "@/components/entity-form-dialog";
import { ConfirmDelete } from "@/components/confirm-delete";
import { AckButton } from "./ack-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { teacherName } from "@/lib/constants";
import { CheckCircle2, Pencil, Plus } from "lucide-react";

const fields: FieldDef[] = [
  { name: "title", label: "หัวเรื่อง", required: true },
  { name: "body", label: "เนื้อหา", type: "textarea", required: true },
];

export default async function CircularsPage() {
  const session = await requireSession();
  const isAdmin = session.user.role === "ADMIN";
  const myTeacherId = session.user.teacherId;

  const [circulars, teacherCount] = await Promise.all([
    prisma.circular.findMany({
      include: { acks: { include: { teacher: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teacher.count(),
  ]);

  return (
    <>
      <PageHeader
        title="จดหมายเวียน"
        description="ประกาศเวียนถึงครูทุกท่าน พร้อมติดตามการรับทราบ"
      >
        {isAdmin && (
          <EntityFormDialog
            title="สร้างจดหมายเวียน"
            fields={fields}
            action={saveCircular.bind(null, null)}
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" /> สร้างจดหมายเวียน
              </Button>
            }
          />
        )}
      </PageHeader>

      <div className="space-y-4">
        {circulars.length === 0 && (
          <p className="text-sm text-muted-foreground">ยังไม่มีจดหมายเวียน</p>
        )}
        {circulars.map((c) => {
          const acked = myTeacherId
            ? c.acks.some((a) => a.teacherId === myTeacherId)
            : false;
          return (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{c.title}</CardTitle>
                    <CardDescription>
                      {new Date(c.createdAt).toLocaleDateString("th-TH", {
                        dateStyle: "long",
                      })}{" "}
                      · รับทราบแล้ว {c.acks.length}/{teacherCount} คน
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {myTeacherId &&
                      (acked ? (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="size-3.5" /> รับทราบแล้ว
                        </Badge>
                      ) : (
                        <AckButton circularId={c.id} />
                      ))}
                    {isAdmin && (
                      <>
                        <EntityFormDialog
                          title="แก้ไขจดหมายเวียน"
                          fields={fields}
                          action={saveCircular.bind(null, c.id)}
                          defaultValues={{ title: c.title, body: c.body }}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <ConfirmDelete
                          action={deleteCircular.bind(null, c.id)}
                          itemLabel={`จดหมายเวียน "${c.title}"`}
                        />
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{c.body}</p>
                {isAdmin && c.acks.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      ผู้รับทราบแล้ว:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.acks.map((a) => (
                        <Badge key={a.id} variant="outline">
                          {teacherName(a.teacher)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
