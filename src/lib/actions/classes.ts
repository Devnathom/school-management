"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { toError, type ActionResult } from "./types";

const classSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อห้อง เช่น ม.1/1"),
  year: z.string().min(4, "กรุณาระบุปีการศึกษา เช่น 2569"),
  homeroomTeacherId: z.string().optional(),
});

export async function saveClassRoom(
  id: string | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = classSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { homeroomTeacherId, ...rest } = parsed.data;
    const data = { ...rest, homeroomTeacherId: homeroomTeacherId || null };

    if (id) {
      await prisma.classRoom.update({ where: { id }, data });
    } else {
      await prisma.classRoom.create({ data });
    }
    revalidatePath("/classes");
    return {};
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { error: "มีห้องเรียนชื่อนี้ในปีการศึกษานี้แล้ว" };
    }
    return toError(e);
  }
}

export async function deleteClassRoom(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.classRoom.delete({ where: { id } });
    revalidatePath("/classes");
    return {};
  } catch (e) {
    return toError(e);
  }
}
