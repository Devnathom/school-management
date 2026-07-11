import ExcelJS from "exceljs";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type TableData = {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  /** ความกว้างคอลัมน์ (หน่วยอักขระของ Excel) ถ้าไม่ระบุใช้ 18 */
  colWidths?: number[];
};

function addTableSheet(wb: ExcelJS.Workbook, sheetName: string, data: TableData) {
  // ชื่อชีตห้ามมีอักขระ : \ / ? * [ ] และยาวไม่เกิน 31
  const ws = wb.addWorksheet(sheetName.replace(/[:\\/?*[\]]/g, "-").slice(0, 31));
  const colCount = data.headers.length;

  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = data.title;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: "center" };

  const headerRow = ws.getRow(3);
  data.headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8E8E8" },
    };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });

  data.rows.forEach((row, r) => {
    const wsRow = ws.getRow(4 + r);
    row.forEach((value, c) => {
      const cell = wsRow.getCell(c + 1);
      cell.value = value;
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  data.headers.forEach((_, i) => {
    ws.getColumn(i + 1).width = data.colWidths?.[i] ?? 18;
  });
}

export async function xlsxResponse(
  filename: string,
  sheets: { name: string; data: TableData }[]
): Promise<Response> {
  const wb = new ExcelJS.Workbook();
  for (const s of sheets) addTableSheet(wb, s.name, s.data);
  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="export.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
