import path from "path";
import PDFDocument from "pdfkit";
import type { TableData } from "./excel";

const FONT_DIR = path.join(process.cwd(), "src/lib/export/fonts");
const FONT = path.join(FONT_DIR, "Sarabun-Regular.ttf");
const FONT_BOLD = path.join(FONT_DIR, "Sarabun-Bold.ttf");

const PADDING = 4;
const HEADER_FILL = "#e8e8e8";
const BORDER = "#999999";

/** สร้าง PDF ตารางข้อมูล (รองรับภาษาไทยด้วยฟอนต์ Sarabun) */
export function pdfResponse(
  filename: string,
  data: TableData,
  { landscape = false }: { landscape?: boolean } = {}
): Promise<Response> {
  const doc = new PDFDocument({
    size: "A4",
    layout: landscape ? "landscape" : "portrait",
    margin: 40,
    font: FONT, // กัน pdfkit โหลด Helvetica (ไม่มีอักขระไทย)
  });
  doc.registerFont("th", FONT);
  doc.registerFont("th-bold", FONT_BOLD);

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) =>
    doc.on("end", () => resolve(Buffer.concat(chunks)))
  );

  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startX = doc.page.margins.left;
  const bottom = doc.page.height - doc.page.margins.bottom;

  // ความกว้างคอลัมน์: เฉลี่ยตามสัดส่วน colWidths หรือแบ่งเท่ากัน
  const weights =
    data.colWidths ?? Array.from({ length: data.headers.length }, () => 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((w) => (w / weightSum) * pageWidth);

  const rowHeight = (cells: (string | number)[], font: string, size: number) => {
    doc.font(font).fontSize(size);
    let h = 0;
    cells.forEach((cell, i) => {
      const cellH = doc.heightOfString(String(cell), {
        width: widths[i] - PADDING * 2,
      });
      h = Math.max(h, cellH);
    });
    return h + PADDING * 2;
  };

  const drawRow = (
    y: number,
    cells: (string | number)[],
    { header = false }: { header?: boolean } = {}
  ) => {
    const font = header ? "th-bold" : "th";
    const size = header ? 11 : 10;
    const h = rowHeight(cells, font, size);
    let x = startX;
    doc.font(font).fontSize(size);
    cells.forEach((cell, i) => {
      if (header) {
        doc.rect(x, y, widths[i], h).fillAndStroke(HEADER_FILL, BORDER);
      } else {
        doc.rect(x, y, widths[i], h).stroke(BORDER);
      }
      doc
        .fillColor("#000000")
        .text(String(cell), x + PADDING, y + PADDING, {
          width: widths[i] - PADDING * 2,
        });
      x += widths[i];
    });
    return h;
  };

  // ชื่อเรื่อง
  doc.font("th-bold").fontSize(16).text(data.title, { align: "center" });
  doc.moveDown(0.5);

  let y = doc.y;
  y += drawRow(y, data.headers, { header: true });
  for (const row of data.rows) {
    const h = rowHeight(row, "th", 10);
    if (y + h > bottom) {
      doc.addPage();
      y = doc.page.margins.top;
      y += drawRow(y, data.headers, { header: true });
    }
    y += drawRow(y, row);
  }

  doc.end();
  return done.then(
    (buffer) =>
      new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="export.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        },
      })
  );
}
