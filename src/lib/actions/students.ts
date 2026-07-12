"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { nextStudentCode } from "./settings";
import { toError, type ActionResult } from "./types";

const studentSchema = z.object({
  studentCode: z.string().optional(), // เว้นว่างได้ ระบบจะออกรหัสให้อัตโนมัติ
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

    const { classRoomId, studentCode, ...rest } = parsed.data;
    const code = studentCode?.trim() ?? "";

    if (id) {
      // แก้ไข: ถ้าเว้นว่างรหัสไว้ ให้คงรหัสเดิม
      await prisma.student.update({
        where: { id },
        data: {
          ...rest,
          classRoomId: classRoomId || null,
          ...(code ? { studentCode: code } : {}),
        },
      });
    } else {
      // เพิ่มใหม่: ถ้าเว้นว่าง ระบบออกรหัสให้อัตโนมัติ
      await prisma.student.create({
        data: {
          ...rest,
          classRoomId: classRoomId || null,
          studentCode: code || (await nextStudentCode()),
        },
      });
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
