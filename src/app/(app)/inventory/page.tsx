import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";
import {
  saveInventoryItem,
  deleteInventoryItem,
  addInventoryTransaction,
} from "@/lib/actions/inventory";
import { PageHeader } from "@/components/page-header";
import { EntityFormDialog, type FieldDef } from "@/components/entity-form-dialog";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { thaiDate } from "@/lib/constants";
import { Pencil, Plus, PackagePlus, PackageMinus } from "lucide-react";

const CATEGORIES = [
  "วัสดุสำนักงาน",
  "วัสดุการเรียนการสอน",
  "วัสดุคอมพิวเตอร์",
  "วัสดุงานบ้านงานครัว",
  "ครุภัณฑ์",
];

const itemFields: FieldDef[] = [
  { name: "code", label: "รหัสพัสดุ", required: true, placeholder: "เช่น MAT-001" },
  { name: "name", label: "ชื่อพัสดุ", required: true },
  {
    name: "category",
    label: "หมวดหมู่",
    type: "select",
    options: CATEGORIES.map((c) => ({ value: c, label: c })),
  },
  { name: "unit", label: "หน่วยนับ", required: true, placeholder: "เช่น ชิ้น, รีม, กล่อง" },
  { name: "minStock", label: "จุดสั่งซื้อขั้นต่ำ", type: "number", required: true },
];

const txFields: FieldDef[] = [
  { name: "quantity", label: "จำนวน", type: "number", required: true },
  { name: "requester", label: "ผู้เบิก/ผู้ส่งมอบ", placeholder: "เว้นว่างเพื่อใช้ชื่อผู้ใช้งาน" },
  { name: "note", label: "หมายเหตุ" },
];

export default async function InventoryPage() {
  const session = await requireSession();
  const isAdmin = session.user.role === "ADMIN";

  const [items, transactions] = await Promise.all([
    prisma.inventoryItem.findMany({ orderBy: { code: "asc" } }),
    prisma.inventoryTransaction.findMany({
      include: { item: true },
      orderBy: { date: "desc" },
      take: 10,
    }),
  ]);

  return (
    <>
      <PageHeader
        title="งานพัสดุ"
        description={`พัสดุทั้งหมด ${items.length} รายการ`}
      >
        {isAdmin && (
          <EntityFormDialog
            title="เพิ่มพัสดุ"
            fields={itemFields}
            action={saveInventoryItem.bind(null, null)}
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" /> เพิ่มพัสดุ
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
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อพัสดุ</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead>คงเหลือ</TableHead>
                <TableHead>ขั้นต่ำ</TableHead>
                <TableHead className="w-56">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const low = item.quantity < item.minStock;
                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.code}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={low ? "destructive" : "secondary"}>
                        {item.quantity} {item.unit}
                        {low && " (ต่ำกว่าขั้นต่ำ)"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.minStock} {item.unit}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EntityFormDialog
                          title={`เบิกจ่าย: ${item.name}`}
                          description={`คงเหลือ ${item.quantity} ${item.unit}`}
                          fields={txFields}
                          action={addInventoryTransaction.bind(null, item.id, "OUT")}
                          trigger={
                            <Button variant="outline" size="sm" className="gap-1">
                              <PackageMinus className="size-3.5" /> เบิก
                            </Button>
                          }
                        />
                        {isAdmin && (
                          <>
                            <EntityFormDialog
                              title={`รับเข้า: ${item.name}`}
                              fields={txFields}
                              action={addInventoryTransaction.bind(null, item.id, "IN")}
                              trigger={
                                <Button variant="outline" size="sm" className="gap-1">
                                  <PackagePlus className="size-3.5" /> รับเข้า
                                </Button>
                              }
                            />
                            <EntityFormDialog
                              title="แก้ไขพัสดุ"
                              fields={itemFields}
                              action={saveInventoryItem.bind(null, item.id)}
                              defaultValues={{
                                code: item.code,
                                name: item.name,
                                category: item.category ?? "",
                                unit: item.unit,
                                minStock: String(item.minStock),
                              }}
                              trigger={
                                <Button variant="ghost" size="icon">
                                  <Pencil className="size-4" />
                                </Button>
                              }
                            />
                            <ConfirmDelete
                              action={deleteInventoryItem.bind(null, item.id)}
                              itemLabel={`พัสดุ ${item.name}`}
                            />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">รายการรับ-จ่ายล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>พัสดุ</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>จำนวน</TableHead>
                <TableHead>ผู้เบิก/ผู้ส่งมอบ</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{thaiDate(tx.date)}</TableCell>
                  <TableCell>{tx.item.name}</TableCell>
                  <TableCell>
                    <Badge variant={tx.type === "IN" ? "secondary" : "outline"}>
                      {tx.type === "IN" ? "รับเข้า" : "เบิกจ่าย"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tx.quantity} {tx.item.unit}
                  </TableCell>
                  <TableCell>{tx.requester ?? "-"}</TableCell>
                  <TableCell>{tx.note ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
