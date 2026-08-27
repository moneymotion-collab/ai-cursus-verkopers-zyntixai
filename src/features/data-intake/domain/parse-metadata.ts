import {
  DATA_PARSER_VERSION,
  type DataCsvDelimiter,
} from "@/features/data-intake/domain/constants";
import {
  isDataStructureWarningCode,
  type DataSourceStructureDiscovery,
  type DataStructureWarningCode,
  type DataXlsxSheetDiscovery,
} from "@/features/data-intake/domain/discovery";
import { isSupportedCsvDelimiter } from "@/features/data-intake/domain/csv-structure";

export function parseMetadataFromDiscovery(
  discovery: DataSourceStructureDiscovery,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    parser_version: discovery.parserVersion,
    warnings: [...discovery.warnings],
    empty_row_count: discovery.emptyRowCount,
    header_names: [...discovery.headers],
  };
  if (discovery.format === "csv") {
    return {
      ...base,
      format: "csv",
      bom: discovery.bom,
    };
  }
  return {
    ...base,
    format: "xlsx",
    selected_sheet: discovery.selectedSheet,
    sheets: discovery.sheets.map((sheet) => ({
      name: sheet.name,
      hidden: sheet.hidden,
      row_count: sheet.rowCount,
      column_count: sheet.columnCount,
    })),
  };
}

export function discoveryFromPersisted(input: {
  sourceKind: "csv" | "xlsx";
  encoding: string | null;
  delimiter: string | null;
  sheetName: string | null;
  headerRowIndex: number | null;
  rowCount: number | null;
  columnCount: number | null;
  parseMetadata: Record<string, unknown>;
}): DataSourceStructureDiscovery | null {
  if (
    input.parseMetadata.parser_version !== DATA_PARSER_VERSION ||
    input.headerRowIndex === null ||
    input.rowCount === null ||
    input.columnCount === null
  ) {
    return null;
  }
  const headers = Array.isArray(input.parseMetadata.header_names)
    ? input.parseMetadata.header_names.filter((value): value is string => typeof value === "string")
    : null;
  const warnings = Array.isArray(input.parseMetadata.warnings)
    ? input.parseMetadata.warnings.filter(
        (value): value is DataStructureWarningCode =>
          typeof value === "string" && isDataStructureWarningCode(value),
      )
    : [];
  if (!headers) {
    return null;
  }
  if (input.sourceKind === "csv") {
    if (!input.delimiter || !isSupportedCsvDelimiter(input.delimiter)) {
      return null;
    }
    return {
      format: "csv",
      parserVersion: DATA_PARSER_VERSION,
      encoding: "utf-8",
      bom: input.parseMetadata.bom === true,
      delimiter: input.delimiter as DataCsvDelimiter,
      headerRowIndex: input.headerRowIndex,
      headers,
      columnCount: input.columnCount,
      rowCount: input.rowCount,
      emptyRowCount:
        typeof input.parseMetadata.empty_row_count === "number"
          ? input.parseMetadata.empty_row_count
          : 0,
      warnings,
    };
  }
  const sheets = Array.isArray(input.parseMetadata.sheets)
    ? input.parseMetadata.sheets.flatMap((value): DataXlsxSheetDiscovery[] => {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          return [];
        }
        const row = value as Record<string, unknown>;
        if (typeof row.name !== "string") {
          return [];
        }
        return [
          {
            name: row.name,
            hidden: row.hidden === true,
            rowCount: typeof row.row_count === "number" ? row.row_count : 0,
            columnCount: typeof row.column_count === "number" ? row.column_count : 0,
          },
        ];
      })
    : [];
  const selectedSheet =
    (typeof input.parseMetadata.selected_sheet === "string"
      ? input.parseMetadata.selected_sheet
      : input.sheetName) ?? sheets[0]?.name;
  if (!selectedSheet) {
    return null;
  }
  return {
    format: "xlsx",
    parserVersion: DATA_PARSER_VERSION,
    encoding: "utf-8",
    selectedSheet,
    sheets,
    headerRowIndex: input.headerRowIndex,
    headers,
    columnCount: input.columnCount,
    rowCount: input.rowCount,
    emptyRowCount:
      typeof input.parseMetadata.empty_row_count === "number"
        ? input.parseMetadata.empty_row_count
        : 0,
    warnings,
  };
}
