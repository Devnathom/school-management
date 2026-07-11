"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { auth } from "@/lib/auth";
import { toError, type ActionResult } from "./types";

/** ปี พ.ศ. ปัจจุบัน ใช้เป็นเลขปีของทะเบียนหนังสือ */
function currentThaiYear() {
  return new Date().getFullYear() + 543;
}

// ---------- หนังสือรับ ----------

const incomingSchema = z.object({
  docNo: z.string().min(1, "กรุณาระบุที่หนังสือ"),
  docDate: z.coerce.date({ message: "กรุณาระบุลงวันที่" }),
  fromOrg: z.string().min(1, "กรุณาระบุหน่วยงานต้นทาง"),
  subject: z.string().min(1, "กรุณาระบุเรื่อง"),
  action: z.string().optional(),
  status: z.enum(["PENDING", "DONE"]).optional(),
});

export async function saveIncoming(
  id: string | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = incomingSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const data = { ...parsed.data, status: parsed.data.status ?? "PENDING" };

    if (id) {
      await prisma.incomingDocument.update({ where: { id }, data });
    } else {
      const year = currentThaiYear();
      // ออกเลขทะเบียนรับต่อเนื่องภายในปี
      await prisma.$transaction(async (tx) => {
        const last = await tx.incomingDocument.findFirst({
          where: { year },
          orderBy: { regNo: "desc" },
        });
        await tx.incomingDocument.create({
          data: { ...data, year, regNo: (last?.regNo ?? 0) + 1 },
        });
      });
    }
    revalidatePath("/documents/incoming");
    revalidatePath("/dashboard");
    return {};
  } catch (e) {
    return toError(e);
  }
}

export async function deleteIncoming(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.incomingDocument.delete({ where: { id } });
    revalidatePath("/documents/incoming");
    return {};
  } catch (e) {
    return toError(e);
  }
}

// ---------- หนังสือส่ง ----------

const outgoingSchema = z.object({
  toOrg: z.string().min(1, "กรุณาระบุหน่วยงานปลายทาง"),
  subject: z.string().min(1, "กรุณาระบุเรื่อง"),
  docDate: z.coerce.date({ message: "กรุณาระบุวันที่" }),
  note: z.string().optional(),
});

export async function saveOutgoing(
  id: string | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = outgoingSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    if (id) {
      await prisma.outgoingDocument.update({ where: { id }, data: parsed.data });
    } else {
      const year = currentThaiYear();
      await prisma.$transaction(async (tx) => {
        const last = await tx.outgoingDocument.findFirst({
          where: { year },
          orderBy: { regNo: "desc" },
        });
        await tx.outgoingDocument.create({
          data: { ...parsed.data, year, regNo: (last?.regNo ?? 0) + 1 },
        });
      });
    }
    revalidatePath("/documents/outgoing");
    return {};
  } catch (e) {
    return toError(e);
  }
}

export async function deleteOutgoing(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.outgoingDocument.delete({ where: { id } });
    revalidatePath("/documents/outgoing");
    return {};
  } catch (e) {
    return toError(e);
  }
}

// ---------- จดหมายเวียน ----------

const circularSchema = z.object({
  title: z.string().min(1, "กรุณาระบุหัวเรื่อง"),
  body: z.string().min(1, "กรุณาระบุเนื้อหา"),
});

export async function saveCircular(
  id: string | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = circularSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    if (id) {
      await prisma.circular.update({ where: { id }, data: parsed.data });
    } else {
      await prisma.circular.create({ data: parsed.data });
    }
    revalidatePath("/documents/circulars");
    revalidatePath("/dashboard");
    return {};
  } catch (e) {
    return toError(e);
  }
}

export async function deleteCircular(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.circular.delete({ where: { id } });
    revalidatePath("/documents/circulars");
    return {};
  } catch (e) {
    return toError(e);
  }
}

export async function acknowledgeCircular(
  circularId: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) return { error: "กรุณาเข้าสู่ระบบ" };
    if (!session.user.teacherId) {
      return { error: "เฉพาะบัญชีครูเท่านั้นที่กดรับทราบได้" };
    }
    await prisma.circularAck.upsert({
      where: {
        circularId_teacherId: {
          circularId,
          teacherId: session.user.teacherId,
        },
      },
      create: { circularId, teacherId: session.user.teacherId },
      update: {},
    });
    revalidatePath("/documents/circulars");
    return {};
  } catch (e) {
    return toError(e);
  }
}
