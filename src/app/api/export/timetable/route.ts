import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { xlsxResponse, type TableData } from "@/lib/export/excel";
import { pdfResponse } from "@/lib/export/pdf";
import { DAYS, PERIODS, teacherName } from "@/lib/constants";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const params = new URL(request.url).searchParams;
  const format = params.get("format") ?? "xlsx";
  const view = params.get("view") === "teacher" ? "teacher" : "class";
  const id = params.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  let title = "ตาราง";
  let filename = "ตาราง";
  if (view === "class") {
    const room = await prisma.classRoom.findUnique({ where: { id } });
    if (!room) return new Response("Not found", { status: 404 });
    title = `ตารางเรียน ห้อง ${room.name} ปีการศึกษา ${room.year}`;
    filename = `ตารางเรียน-${room.name}`;
  } else {
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) return new Response("Not found", { status: 404 });
    title = `ตารางสอน ${teacherName(teacher)}`;
    filename = `ตารางสอน-${teacher.firstName}`;
  }

  const entries = await prisma.timetableEntry.findMany({
    where: view === "class" ? { classRoomId: id } : { teacherId: id },
    include: { subject: true, teacher: true, classRoom: true },
  });
  const byCell = new Map<string, (typeof entries)[number]>();
  for (const e of entries) byCell.set(`${e.dayOfWeek}-${e.period}`, e);

  const data: TableData = {
    title,
    headers: ["วัน", ...PERIODS.map((p) => `คาบ ${p}`)],
    rows: DAYS.map((day) => [
      day.label,
      ...PERIODS.map((p) => {
        const e = byCell.get(`${day.value}-${p}`);
        if (!e) return "";
        const who =
          view === "class"
            ? `${e.teacher.prefix}${e.teacher.firstName}`
            : `ห้อง ${e.classRoom.name}`;
        return `${e.subject.code}\n${e.subject.name}\n${who}${e.locked ? " (ล็อก)" : ""}`;
      }),
    ]),
    colWidths: [8, ...PERIODS.map(() => 16)],
  };

  if (format === "pdf") return pdfResponse(`${filename}.pdf`, data, { landscape: true });
  return xlsxResponse(`${filename}.xlsx`, [{ name: filename, data }]);
}
