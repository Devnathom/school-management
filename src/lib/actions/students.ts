"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { toError, type ActionResult } from "./types";

const studentSchema = z.object({
  studentCode: z.string().min(1, "กรุณาระบุรหัสนักเรียน"),
  prefix: z.string().min(1, "กรุณาระบุคำนำหน้า"),
  firstName: z.string().min(1, "กรุณาระบุชื่อ"),
  lastName: z.string().min(1, "กรุณาระบุนามสกุล"),
  classRoomId: z.string().optional(),
});

export async function saveStudent(
  id: string | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = studentSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { classRoomId, ...rest } = parsed.data;
    const data = { ...rest, classRoomId: classRoomId || null };

    if (id) {
      await prisma.student.update({ where: { id }, data });
    } else {
      await prisma.student.create({ data });
    }
    revalidatePath("/students");
    return {};
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { error: "รหัสนักเรียนนี้มีอยู่แล้ว" };
    }
    return toError(e);
  }
}

export async function deleteStudent(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.student.delete({ where: { id } });
    revalidatePath("/students");
    return {};
  } catch (e) {
    return toError(e);
  }
}
