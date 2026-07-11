"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { generateSchedule } from "@/lib/scheduler";
import { toError, type ActionResult } from "./types";

const assignmentSchema = z.object({
  subjectId: z.string().min(1, "กรุณาเลือกรายวิชา"),
  teacherId: z.string().min(1, "กรุณาเลือกครูผู้สอน"),
  periodsPerWeek: z.coerce
    .number()
    .int()
    .min(1, "อย่างน้อย 1 คาบ/สัปดาห์")
    .max(10, "ไม่เกิน 10 คาบ/สัปดาห์"),
});

export async function saveAssignment(
  classRoomId: string,
  id: string | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = assignmentSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    if (id) {
      await prisma.teachingAssignment.update({
        where: { id },
        data: parsed.data,
      });
    } else {
      await prisma.teachingAssignment.create({
        data: { classRoomId, ...parsed.data },
      });
    }
    revalidatePath("/timetable/auto");
    return {};
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { error: "ห้องนี้มีการมอบหมายวิชานี้อยู่แล้ว (แก้ไขรายการเดิมแทน)" };
    }
    return toError(e);
  }
}

export async function deleteAssignment(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.teachingAssignment.delete({ where: { id } });
    revalidatePath("/timetable/auto");
    return {};
  } catch (e) {
    return toError(e);
  }
}

export type AutoScheduleResult = ActionResult & { message?: string };

/**
 * จัดตารางอัตโนมัติจากข้อมูลมอบหมายการสอนทั้งหมด
 * mode "clear" = ล้างตารางเดิมทั้งหมดแล้วจัดใหม่, "fill" = คงคาบเดิมไว้ จัดเติมเฉพาะที่ขาด
 */
export async function autoSchedule(
  mode: "clear" | "fill"
): Promise<AutoScheduleResult> {
  try {
    await requireAdmin();

    const assignments = await prisma.teachingAssignment.findMany({
      include: { classRoom: true },
    });
    if (assignments.length === 0) {
      return { error: "ยังไม่มีข้อมูลมอบหมายการสอน กรุณาเพิ่มก่อนจัดตาราง" };
    }

    // ห้องใดมีคาบรวมเกินช่องในตาราง (5 วัน × 8 คาบ = 40) จัดไม่ได้แน่นอน
    const perClass = new Map<string, { name: string; total: number }>();
    for (const a of assignments) {
      const cur = perClass.get(a.classRoomId) ?? {
        name: a.classRoom.name,
        total: 0,
      };
      cur.total += a.periodsPerWeek;
      perClass.set(a.classRoomId, cur);
    }
    const overload = [...perClass.values()].filter((c) => c.total > 40);
    if (overload.length > 0) {
      return {
        error: `คาบรวมเกิน 40 คาบ/สัปดาห์: ${overload
          .map((c) => `${c.name} (${c.total} คาบ)`)
          .join(", ")}`,
      };
    }

    const fixed =
      mode === "fill" ? await prisma.timetableEntry.findMany() : [];

    const result = generateSchedule({
      assignments: assignments.map((a) => ({
        classRoomId: a.classRoomId,
        subjectId: a.subjectId,
        teacherId: a.teacherId,
        periodsPerWeek: a.periodsPerWeek,
      })),
      fixed,
    });

    await prisma.$transaction(async (tx) => {
      if (mode === "clear") {
        await tx.timetableEntry.deleteMany();
      }
      if (result.placed.length > 0) {
        await tx.timetableEntry.createMany({ data: result.placed });
      }
    });

    revalidatePath("/timetable");
    revalidatePath("/timetable/auto");

    if (result.unplaced.length > 0) {
      return {
        message: `จัดได้ ${result.placed.length} คาบ แต่มี ${result.unplaced.length} คาบที่จัดไม่ลง (ครูหรือห้องไม่ว่างพอ) ลองลดคาบ/สัปดาห์หรือกระจายครูผู้สอน`,
      };
    }
    return {
      message: `จัดตารางสำเร็จทั้งหมด ${result.placed.length} คาบ ไม่มีคาบชนกัน`,
    };
  } catch (e) {
    return toError(e);
  }
}
