import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { xlsxResponse, type TableData } from "@/lib/export/excel";
import { pdfResponse } from "@/lib/export/pdf";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const format = new URL(request.url).searchParams.get("format") ?? "xlsx";
  const teachers = await prisma.teacher.findMany({
    orderBy: { createdAt: "asc" },
  });

  const data: TableData = {
    title: `รายชื่อครูและบุคลากร (${teachers.length} คน)`,
    headers: ["ลำดับ", "ชื่อ-นามสกุล", "ตำแหน่ง", "กลุ่มสาระการเรียนรู้", "เบอร์โทร", "อีเมล"],
    rows: teachers.map((t, i) => [
      i + 1,
      `${t.prefix}${t.firstName} ${t.lastName}`,
      t.position ?? "-",
      t.department ?? "-",
      t.phone ?? "-",
      t.email ?? "-",
    ]),
    colWidths: [6, 24, 18, 22, 14, 24],
  };

  if (format === "pdf") return pdfResponse("รายชื่อครู.pdf", data);
  return xlsxResponse("รายชื่อครู.xlsx", [{ name: "รายชื่อครู", data }]);
}
