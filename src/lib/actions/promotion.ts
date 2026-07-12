"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { toError, type ActionResult } from "./types";

export type PromoteResult = ActionResult & { message?: string };

/**
 * เลื่อนชั้น: ย้ายนักเรียนทั้งห้องต้นทางไปห้องปลายทาง
 * targetId = "GRADUATE" หมายถึงนำออกจากห้อง (จบการศึกษา/ลาออก)
 */
export async function promoteClass(
  sourceId: string,
  formData: FormData
): Promise<PromoteResult> {
  try {
    await requireAdmin();
    const targetId = String(formData.get("targetId") ?? "");
    if (!targetId) return { error: "กรุณาเลือกห้องปลายทาง" };
    if (targetId === sourceId) return { error: "ห้องต้นทางและปลายทางเป็นห้องเดียวกัน" };

    const source = await prisma.classRoom.findUnique({
      where: { id: sourceId },
      include: { _count: { select: { students: true } } },
    });
    if (!source) return { error: "ไม่พบห้องต้นทาง" };
    if (source._count.students === 0) {
      return { error: `ห้อง ${source.name} ไม่มีนักเรียน` };
    }

    if (targetId === "GRADUATE") {
      const result = await prisma.student.updateMany({
        where: { classRoomId: sourceId },
        data: { classRoomId: null },
      });
      revalidatePath("/students");
      revalidatePath("/classes");
      revalidatePath("/promotion");
      return {
        message: `นำนักเรียน ${result.count} คนออกจากห้อง ${source.name} (จบการศึกษา) เรียบร้อย`,
      };
    }

    const target = await prisma.classRoom.findUnique({ where: { id: targetId } });
    if (!target) return { error: "ไม่พบห้องปลายทาง" };

    const result = await prisma.student.updateMany({
      where: { classRoomId: sourceId },
      data: { classRoomId: targetId },
    });
    revalidatePath("/students");
    revalidatePath("/classes");
    revalidatePath("/promotion");
    return {
      message: `เลื่อนชั้นนักเรียน ${result.count} คน จาก ${source.name} (ปี ${source.year}) ไป ${target.name} (ปี ${target.year}) เรียบร้อย`,
    };
  } catch (e) {
    return toError(e);
  }
}
