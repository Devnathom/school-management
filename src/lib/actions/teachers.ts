"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { toError, type ActionResult } from "./types";

const teacherSchema = z.object({
  prefix: z.string().min(1, "กรุณาระบุคำนำหน้า"),
  firstName: z.string().min(1, "กรุณาระบุชื่อ"),
  lastName: z.string().min(1, "กรุณาระบุนามสกุล"),
  position: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

export async function saveTeacher(
  id: string | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = teacherSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    if (id) {
      await prisma.teacher.update({ where: { id }, data: parsed.data });
    } else {
      await prisma.teacher.create({ data: parsed.data });
    }
    revalidatePath("/teachers");
    return {};
  } catch (e) {
    return toError(e);
  }
}

export async function deleteTeacher(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.teacher.delete({ where: { id } });
    revalidatePath("/teachers");
    return {};
  } catch (e) {
    return toError(e);
  }
}
