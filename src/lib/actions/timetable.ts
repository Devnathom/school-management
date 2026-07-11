"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { teacherName, DAYS } from "@/lib/constants";
import { toError, type ActionResult } from "./types";

const entrySchema = z.object({
  classRoomId: z.string().min(1, "กรุณาเลือกห้องเรียน"),
  subjectId: z.string().min(1, "กรุณาเลือกรายวิชา"),
  teacherId: z.string().min(1, "กรุณาเลือกครูผู้สอน"),
  dayOfWeek: z.coerce.number().min(1).max(5),
  period: z.coerce.number().min(1).max(8),
});

export async function saveTimetableEntry(
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = entrySchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const { classRoomId, subjectId, teacherId, dayOfWeek, period } = parsed.data;

    const dayLabel = DAYS.find((d) => d.value === dayOfWeek)?.label ?? "";

    // ตรวจการชนกัน: ครูสอนซ้อนคาบ
    const teacherBusy = await prisma.timetableEntry.findFirst({
      where: { teacherId, dayOfWeek, period },
      include: { classRoom: true, subject: true, teacher: true },
    });
    if (teacherBusy) {
      return {
        error: `คาบชนกัน: ${teacherName(teacherBusy.teacher)} มีสอนวิชา ${teacherBusy.subject.name} ห้อง ${teacherBusy.classRoom.name} ในวัน${dayLabel} คาบ ${period} อยู่แล้ว`,
      };
    }

    // ตรวจการชนกัน: ห้องเรียนมีวิชาซ้อนคาบ
    const roomBusy = await prisma.timetableEntry.findFirst({
      where: { classRoomId, dayOfWeek, period },
      include: { classRoom: true, subject: true },
    });
    if (roomBusy) {
      return {
        error: `คาบชนกัน: ห้อง ${roomBusy.classRoom.name} มีวิชา ${roomBusy.subject.name} ในวัน${dayLabel} คาบ ${period} อยู่แล้ว`,
      };
    }

    await prisma.timetableEntry.create({ data: parsed.data });
    revalidatePath("/timetable");
    return {};
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { error: "คาบเรียนนี้ชนกับคาบที่มีอยู่แล้ว" };
    }
    return toError(e);
  }
}

export async function deleteTimetableEntry(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.timetableEntry.delete({ where: { id } });
    revalidatePath("/timetable");
    return {};
  } catch (e) {
    return toError(e);
  }
}
