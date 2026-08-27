import { DATA_PARSER_VERSION, type DataCsvDelimiter } from "@/features/data-intake/domain/constants";

export const DATA_STRUCTURE_WARNING_CODES = [
  "DUPLICATE_HEADER",
  "EMPTY_HEADER",
  "WHITESPACE_HEADER",
  "CONTROL_CHARACTER_HEADER",
  "INCONSISTENT_COLUMN_COUNT",
  "EMPTY_ROWS",
  "FORMULA_CELL",
  "FORMULA_LIKE_CELL",
  "HIDDEN_SHEET",
] as const;

export type DataStructureWarningCode = (typeof DATA_STRUCTURE_WARNING_CODES)[number];

export type DataXlsxSheetDiscovery = {
  name: string;
  hidden: boolean;
  rowCount: number;
  columnCount: number;
};

type DataStructureDiscoveryBase = {
  parserVersion: typeof DATA_PARSER_VERSION;
  headerRowIndex: number;
  headers: readonly string[];
  columnCount: number;
  rowCount: number;
  emptyRowCount: number;
  warnings: readonly DataStructureWarningCode[];
};

export type DataCsvStructureDiscovery = DataStructureDiscoveryBase & {
  format: "csv";
  encoding: "utf-8";
  bom: boolean;
  delimiter: DataCsvDelimiter;
};

export type DataXlsxStructureDiscovery = DataStructureDiscoveryBase & {
  format: "xlsx";
  encoding: "utf-8";
  selectedSheet: string;
  sheets: readonly DataXlsxSheetDiscovery[];
};

export type DataSourceStructureDiscovery =
  | DataCsvStructureDiscovery
  | DataXlsxStructureDiscovery;

export function isDataStructureWarningCode(
  value: string,
): value is DataStructureWarningCode {
  return (DATA_STRUCTURE_WARNING_CODES as readonly string[]).includes(value);
}

export function canonicalStructureFingerprint(
  discovery: DataSourceStructureDiscovery,
): string {
  const base = {
    parserVersion: discovery.parserVersion,
    format: discovery.format,
    headerRowIndex: discovery.headerRowIndex,
    headers: [...discovery.headers],
    columnCount: discovery.columnCount,
    rowCount: discovery.rowCount,
    emptyRowCount: discovery.emptyRowCount,
    warnings: [...discovery.warnings].sort(),
  };
  if (discovery.format === "csv") {
    return JSON.stringify({
      ...base,
      encoding: discovery.encoding,
      bom: discovery.bom,
      delimiter: discovery.delimiter,
    });
  }
  return JSON.stringify({
    ...base,
    encoding: discovery.encoding,
    selectedSheet: discovery.selectedSheet,
    sheets: discovery.sheets.map((sheet) => ({
      name: sheet.name,
      hidden: sheet.hidden,
      rowCount: sheet.rowCount,
      columnCount: sheet.columnCount,
    })),
  });
}
