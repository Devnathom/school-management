"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { toError, type ActionResult } from "./types";

const subjectSchema = z.object({
  code: z.string().min(1, "กรุณาระบุรหัสวิชา"),
  name: z.string().min(1, "กรุณาระบุชื่อวิชา"),
  department: z.string().optional(),
});

export async function saveSubject(
  id: string | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = subjectSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    if (id) {
      await prisma.subject.update({ where: { id }, data: parsed.data });
    } else {
      await prisma.subject.create({ data: parsed.data });
    }
    revalidatePath("/subjects");
    return {};
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { error: "รหัสวิชานี้มีอยู่แล้ว" };
    }
    return toError(e);
  }
}

export async function deleteSubject(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.subject.delete({ where: { id } });
    revalidatePath("/subjects");
    return {};
  } catch (e) {
    return toError(e);
  }
}
