/**
 * DATA-1G source-row extraction.
 * Reuses the DATA-1E CSV/XLSX parsers. Formulas are never evaluated.
 */

import { parseCsvRecords, detectCsvDelimiter } from "@/features/data-intake/domain/csv-structure";
import { extractXlsxSelectedSheetRecords } from "@/features/data-intake/domain/xlsx-structure";
import { decodeUtf8Strict } from "@/features/data-intake/domain/utf8";
import { inspectSourceBytes } from "@/features/data-intake/domain/file-signature";
import { dataFail, dataOk, type DataIntakeResult } from "@/features/data-intake/domain/errors";
import type { DataSourceKind } from "@/features/data-intake/domain/constants";

export type DataSourceDataRow = {
  sourceRowNumber: number;
  sheetName: string | null;
  values: readonly string[];
};

export type DataSourceRowParse = {
  format: "csv" | "xlsx";
  headers: readonly string[];
  headerRowIndex: number;
  selectedSheet: string | null;
  rows: readonly DataSourceDataRow[];
};

export async function parseSourceDataRows(input: {
  kind: DataSourceKind;
  bytes: Uint8Array;
}): Promise<DataIntakeResult<DataSourceRowParse>> {
  const signature = inspectSourceBytes(input);
  if (signature === "legacy_xls") {
    return dataFail("UNSUPPORTED_FILE", ".xls is not supported");
  }
  if (signature !== "ok") {
    return dataFail("UNSUPPORTED_FILE", "File signature does not match the declared source type");
  }
  if (input.kind === "csv") {
    const decoded = decodeUtf8Strict(input.bytes);
    if (!decoded.ok) {
      return decoded;
    }
    const delimiter = detectCsvDelimiter(decoded.value.text);
    const parsed = parseCsvRecords(decoded.value.text, delimiter);
    if (!parsed.ok) {
      return parsed;
    }
    const records = parsed.value;
    if (records.length === 0 || records[0]?.every((cell) => cell === "")) {
      return dataFail("HEADER_INVALID", "CSV has no header row");
    }
    const headers = records[0] ?? [];
    const rows = records.slice(1).map((values, index) => ({
      sourceRowNumber: 2 + index,
      sheetName: null,
      values,
    }));
    return dataOk({
      format: "csv",
      headers,
      headerRowIndex: 1,
      selectedSheet: null,
      rows,
    });
  }

  const extracted = await extractXlsxSelectedSheetRecords(input.bytes);
  if (!extracted.ok) {
    return extracted;
  }
  return dataOk({
    format: "xlsx",
    headers: extracted.value.headers,
    headerRowIndex: extracted.value.headerRowIndex,
    selectedSheet: extracted.value.selectedSheet,
    rows: extracted.value.rows,
  });
}
