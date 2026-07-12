"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { PERIODS } from "@/lib/constants";
import { toError, type ActionResult } from "./types";

const STUDENT_CODE_START_KEY = "student_code_start";

/** เลขรหัสนักเรียนถัดไปที่ระบบจะออกให้: max(เลขเริ่มต้นที่ตั้งไว้, รหัสตัวเลขสูงสุดที่มี + 1) */
export async function nextStudentCode(): Promise<string> {
  const [setting, students] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: STUDENT_CODE_START_KEY } }),
    prisma.student.findMany({ select: { studentCode: true } }),
  ]);
  const start = Number(setting?.value ?? "10001") || 10001;
  const maxExisting = students.reduce(
    (max, s) =>
      /^\d+$/.test(s.studentCode) ? Math.max(max, Number(s.studentCode)) : max,
    0
  );
  return String(Math.max(start, maxExisting + 1));
}

const startCodeSchema = z.object({
  startCode: z.coerce
    .number()
    .int()
    .min(1, "ต้องเป็นเลขจำนวนเต็มบวก")
    .max(999999999, "เลขยาวเกินไป"),
});

export async function saveStudentCodeStart(
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = startCodeSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    await prisma.appSetting.upsert({
      where: { key: STUDENT_CODE_START_KEY },
      create: { key: STUDENT_CODE_START_KEY, value: String(parsed.data.startCode) },
      update: { value: String(parsed.data.startCode) },
    });
    revalidatePath("/students");
    return {};
  } catch (e) {
    return toError(e);
  }
}

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function savePeriodTimes(
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    for (const p of PERIODS) {
      const startTime = String(formData.get(`start-${p}`) ?? "");
      const endTime = String(formData.get(`end-${p}`) ?? "");
      if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
        return { error: `คาบ ${p}: กรุณาระบุเวลาให้ครบถ้วน` };
      }
      if (startTime >= endTime) {
        return { error: `คาบ ${p}: เวลาเริ่มต้องมาก่อนเวลาจบ` };
      }
      await prisma.periodTime.upsert({
        where: { period: p },
        create: { period: p, startTime, endTime },
        update: { startTime, endTime },
      });
    }
    revalidatePath("/timetable");
    return {};
  } catch (e) {
    return toError(e);
  }
}
