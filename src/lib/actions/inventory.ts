"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { auth } from "@/lib/auth";
import { toError, type ActionResult } from "./types";

const itemSchema = z.object({
  code: z.string().min(1, "กรุณาระบุรหัสพัสดุ"),
  name: z.string().min(1, "กรุณาระบุชื่อพัสดุ"),
  category: z.string().optional(),
  unit: z.string().min(1, "กรุณาระบุหน่วยนับ"),
  minStock: z.coerce.number().min(0, "จุดสั่งซื้อขั้นต่ำต้องไม่ติดลบ"),
});

export async function saveInventoryItem(
  id: string | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = itemSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    if (id) {
      await prisma.inventoryItem.update({ where: { id }, data: parsed.data });
    } else {
      await prisma.inventoryItem.create({ data: parsed.data });
    }
    revalidatePath("/inventory");
    return {};
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { error: "รหัสพัสดุนี้มีอยู่แล้ว" };
    }
    return toError(e);
  }
}

export async function deleteInventoryItem(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.inventoryItem.delete({ where: { id } });
    revalidatePath("/inventory");
    return {};
  } catch (e) {
    return toError(e);
  }
}

const txSchema = z.object({
  quantity: z.coerce.number().int().positive("จำนวนต้องมากกว่า 0"),
  requester: z.string().optional(),
  note: z.string().optional(),
});

export async function addInventoryTransaction(
  itemId: string,
  type: "IN" | "OUT",
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) return { error: "กรุณาเข้าสู่ระบบ" };
    // รับเข้าเฉพาะผู้ดูแลระบบ ส่วนเบิกจ่ายครูทำได้
    if (type === "IN" && session.user.role !== "ADMIN") {
      return { error: "เฉพาะผู้ดูแลระบบเท่านั้นที่บันทึกรับเข้าได้" };
    }

    const parsed = txSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const { quantity, requester, note } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item) throw new Error("ไม่พบพัสดุ");
      if (type === "OUT" && item.quantity < quantity) {
        throw new Error(
          `พัสดุคงเหลือไม่พอ (คงเหลือ ${item.quantity} ${item.unit})`
        );
      }
      await tx.inventoryTransaction.create({
        data: {
          itemId,
          type,
          quantity,
          requester: requester || session.user.name || null,
          note: note || null,
        },
      });
      return tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          quantity: { [type === "IN" ? "increment" : "decrement"]: quantity },
        },
      });
    });

    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return result ? {} : {};
  } catch (e) {
    return toError(e);
  }
}
