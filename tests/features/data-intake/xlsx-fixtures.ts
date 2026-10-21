import ExcelJS from "exceljs";

export async function buildSimpleXlsx(input: {
  sheets: Array<{
    name: string;
    hidden?: boolean;
    rows: Array<Array<string | number | { formula: string } | Date | null>>;
  }>;
}): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  for (const sheet of input.sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);
    if (sheet.hidden) {
      worksheet.state = "hidden";
    }
    for (const row of sheet.rows) {
      worksheet.addRow(
        row.map((cell) => {
          if (cell && typeof cell === "object" && "formula" in cell) {
            return { formula: cell.formula };
          }
          return cell;
        }),
      );
    }
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
