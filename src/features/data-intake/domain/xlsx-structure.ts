import ExcelJS from "exceljs";
import {
  DATA_MAX_COLUMNS,
  DATA_MAX_DATA_ROWS,
  DATA_MAX_HEADER_LENGTH,
  DATA_MAX_XLSX_SHEETS,
  DATA_PARSER_VERSION,
} from "@/features/data-intake/domain/constants";
import {
  dataFail,
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import type {
  DataStructureWarningCode,
  DataXlsxSheetDiscovery,
  DataXlsxStructureDiscovery,
} from "@/features/data-intake/domain/discovery";
import { collectHeaderWarnings } from "@/features/data-intake/domain/header-safety";
import { inspectXlsxZipSafety } from "@/features/data-intake/domain/xlsx-zip-safety";
import { inspectSourceBytes } from "@/features/data-intake/domain/file-signature";

function cellText(value: ExcelJS.CellValue): {
  text: string;
  formula: boolean;
} {
  if (value === null || value === undefined) {
    return { text: "", formula: false };
  }
  if (typeof value === "object" && "formula" in value) {
    const formula = typeof value.formula === "string" ? value.formula : "";
    return { text: `=${formula}`, formula: true };
  }
  if (typeof value === "object" && "richText" in value && Array.isArray(value.richText)) {
    return {
      text: value.richText.map((part) => part.text).join(""),
      formula: false,
    };
  }
  if (typeof value === "object" && "text" in value && typeof value.text === "string") {
    return { text: value.text, formula: false };
  }
  if (value instanceof Date) {
    return { text: value.toISOString().slice(0, 10), formula: false };
  }
  if (typeof value === "object" && "result" in value) {
    return { text: String(value.result ?? ""), formula: false };
  }
  return { text: String(value), formula: false };
}

function sheetHidden(state: ExcelJS.Worksheet["state"]): boolean {
  return state === "hidden" || state === "veryHidden";
}

function selectDefaultSheet(sheets: readonly DataXlsxSheetDiscovery[]): string | null {
  const visible = sheets.find((sheet) => !sheet.hidden);
  return visible?.name ?? sheets[0]?.name ?? null;
}

type DataXlsxDataRow = {
  sourceRowNumber: number;
  sheetName: string | null;
  values: readonly string[];
};

export type DataXlsxSelectedSheetRecords = {
  selectedSheet: string;
  headerRowIndex: number;
  headers: readonly string[];
  rows: readonly DataXlsxDataRow[];
  discovery: DataXlsxStructureDiscovery;
};

export async function extractXlsxSelectedSheetRecords(
  bytes: Uint8Array,
): Promise<DataIntakeResult<DataXlsxSelectedSheetRecords>> {
  const parsed = await parseXlsxStructure(bytes);
  if (!parsed.ok) {
    return parsed;
  }
  const loaded = await loadXlsxSelectedRows(bytes, parsed.value);
  if (!loaded.ok) {
    return loaded;
  }
  return dataOk({
    selectedSheet: parsed.value.selectedSheet,
    headerRowIndex: parsed.value.headerRowIndex,
    headers: parsed.value.headers,
    rows: loaded.value,
    discovery: parsed.value,
  });
}

async function loadXlsxSelectedRows(
  bytes: Uint8Array,
  discovery: DataXlsxStructureDiscovery,
): Promise<DataIntakeResult<DataXlsxDataRow[]>> {
  const workbook = new ExcelJS.Workbook();
  try {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    await workbook.xlsx.load(copy.buffer);
  } catch {
    return dataFail("MALFORMED_XLSX", "Workbook XML could not be parsed");
  }
  const worksheet = workbook.worksheets.find((sheet) => sheet.name === discovery.selectedSheet);
  if (!worksheet) {
    return dataFail("MALFORMED_XLSX", "Selected sheet is no longer present");
  }
  const rows: DataXlsxDataRow[] = [];
  worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber <= discovery.headerRowIndex) {
      return;
    }
    const values: string[] = [];
    for (let column = 1; column <= discovery.columnCount; column += 1) {
      values.push(cellText(row.getCell(column).value).text);
    }
    rows.push({
      sourceRowNumber: rowNumber,
      sheetName: discovery.selectedSheet,
      values,
    });
  });
  return dataOk(rows);
}

export async function parseXlsxStructure(
  bytes: Uint8Array,
): Promise<DataIntakeResult<DataXlsxStructureDiscovery>> {
  const signature = inspectSourceBytes({ kind: "xlsx", bytes });
  if (signature === "legacy_xls") {
    return dataFail("UNSUPPORTED_FILE", ".xls is not supported");
  }
  if (signature !== "ok") {
    return dataFail("MALFORMED_XLSX", "File is not a ZIP-based XLSX workbook");
  }
  const zip = inspectXlsxZipSafety(bytes);
  if (!zip.ok) {
    return zip;
  }

  const workbook = new ExcelJS.Workbook();
  try {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    await workbook.xlsx.load(copy.buffer);
  } catch {
    return dataFail("MALFORMED_XLSX", "Workbook XML could not be parsed");
  }

  if (workbook.worksheets.length === 0) {
    return dataFail("MALFORMED_XLSX", "Workbook contains no sheets");
  }
  if (workbook.worksheets.length > DATA_MAX_XLSX_SHEETS) {
    return dataFail("TOO_MANY_SHEETS", "Workbook exceeds the v1 sheet limit");
  }

  const warnings: DataStructureWarningCode[] = [];
  const sheets: DataXlsxSheetDiscovery[] = [];
  const sheetRows = new Map<string, string[][]>();

  for (const worksheet of workbook.worksheets) {
    if (sheetHidden(worksheet.state)) {
      if (!warnings.includes("HIDDEN_SHEET")) {
        warnings.push("HIDDEN_SHEET");
      }
    }
    const rows: string[][] = [];
    let maxColumns = 0;
    let overflow = false;
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber > DATA_MAX_DATA_ROWS + 1) {
        overflow = true;
        return;
      }
      const values: string[] = [];
      const cellCount = Math.max(row.cellCount, 1);
      for (let column = 1; column <= cellCount; column += 1) {
        const parsed = cellText(row.getCell(column).value);
        if (parsed.formula && !warnings.includes("FORMULA_CELL")) {
          warnings.push("FORMULA_CELL");
        }
        values.push(parsed.text);
      }
      while (values.length > 0 && values[values.length - 1] === "") {
        values.pop();
      }
      maxColumns = Math.max(maxColumns, values.length);
      rows.push(values);
    });
    if (maxColumns > DATA_MAX_COLUMNS) {
      return dataFail("TOO_MANY_COLUMNS", "Workbook exceeds the v1 column limit");
    }
    if (overflow || rows.length > DATA_MAX_DATA_ROWS + 1 || worksheet.rowCount > DATA_MAX_DATA_ROWS + 1) {
      return dataFail("TOO_MANY_ROWS", "Workbook exceeds the v1 data row limit");
    }
    sheets.push({
      name: worksheet.name,
      hidden: sheetHidden(worksheet.state),
      rowCount: Math.max(0, rows.length - 1),
      columnCount: maxColumns,
    });
    sheetRows.set(worksheet.name, rows);
  }

  const selectedSheet = selectDefaultSheet(sheets);
  if (!selectedSheet) {
    return dataFail("MALFORMED_XLSX", "Workbook contains no selectable sheet");
  }
  const selectedRows = sheetRows.get(selectedSheet) ?? [];
  const headerIndex = selectedRows.findIndex((row) => row.some((cell) => cell.trim() !== ""));
  if (headerIndex < 0) {
    return dataFail("HEADER_INVALID", "Selected sheet has no header row");
  }
  const headerRow = selectedRows[headerIndex] ?? [];
  if (headerRow.length === 0) {
    return dataFail("HEADER_INVALID", "Selected sheet has no header row");
  }
  for (const header of headerRow) {
    if (header.length > DATA_MAX_HEADER_LENGTH) {
      return dataFail("HEADER_INVALID", "An XLSX header exceeds the v1 length limit");
    }
  }
  warnings.push(...collectHeaderWarnings(headerRow));
  const dataRows = selectedRows.slice(headerIndex + 1);
  let emptyRowCount = 0;
  let inconsistent = false;
  for (const record of dataRows) {
    if (record.length !== headerRow.length) {
      inconsistent = true;
    }
    if (record.every((cell) => cell.trim() === "")) {
      emptyRowCount += 1;
    }
  }
  if (inconsistent) {
    warnings.push("INCONSISTENT_COLUMN_COUNT");
  }
  if (emptyRowCount > 0) {
    warnings.push("EMPTY_ROWS");
  }

  const uniqueWarnings = [...new Set(warnings)];
  return dataOk({
    format: "xlsx",
    parserVersion: DATA_PARSER_VERSION,
    encoding: "utf-8",
    selectedSheet,
    sheets,
    headerRowIndex: headerIndex + 1,
    headers: headerRow,
    columnCount: headerRow.length,
    rowCount: dataRows.length,
    emptyRowCount,
    warnings: uniqueWarnings,
  });
}
