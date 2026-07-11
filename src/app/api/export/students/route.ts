import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { xlsxResponse, type TableData } from "@/lib/export/excel";
import { pdfResponse } from "@/lib/export/pdf";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const params = new URL(request.url).searchParams;
  const format = params.get("format") ?? "xlsx";
  const classId = params.get("class");

  const [students, classRoom] = await Promise.all([
    prisma.student.findMany({
      where: classId ? { classRoomId: classId } : undefined,
      include: { classRoom: true },
      orderBy: { studentCode: "asc" },
    }),
    classId
      ? prisma.classRoom.findUnique({ where: { id: classId } })
      : Promise.resolve(null),
  ]);

  const scope = classRoom
    ? `ห้อง ${classRoom.name} ปีการศึกษา ${classRoom.year}`
    : "ทุกห้องเรียน";

  const data: TableData = {
    title: `รายชื่อนักเรียน ${scope} (${students.length} คน)`,
    headers: ["ลำดับ", "รหัสนักเรียน", "ชื่อ-นามสกุล", "ห้องเรียน"],
    rows: students.map((s, i) => [
      i + 1,
      s.studentCode,
      `${s.prefix}${s.firstName} ${s.lastName}`,
      s.classRoom?.name ?? "-",
    ]),
    colWidths: [6, 12, 30, 12],
  };

  const filename = classRoom
    ? `รายชื่อนักเรียน-${classRoom.name}`
    : "รายชื่อนักเรียน";
  if (format === "pdf") return pdfResponse(`${filename}.pdf`, data);
  return xlsxResponse(`${filename}.xlsx`, [{ name: "รายชื่อนักเรียน", data }]);
}
