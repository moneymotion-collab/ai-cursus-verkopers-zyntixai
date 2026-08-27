import {
  DATA_CSV_DELIMITER_PROBE_LINES,
  DATA_CSV_DELIMITERS,
  DATA_MAX_COLUMNS,
  DATA_MAX_DATA_ROWS,
  DATA_MAX_FIELD_LENGTH,
  DATA_MAX_HEADER_LENGTH,
  DATA_PARSER_VERSION,
  type DataCsvDelimiter,
} from "@/features/data-intake/domain/constants";
import {
  dataFail,
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import type {
  DataCsvStructureDiscovery,
  DataStructureWarningCode,
} from "@/features/data-intake/domain/discovery";
import { decodeUtf8Strict } from "@/features/data-intake/domain/utf8";
import { collectHeaderWarnings } from "@/features/data-intake/domain/header-safety";

function isDelimiter(value: string): value is DataCsvDelimiter {
  return (DATA_CSV_DELIMITERS as readonly string[]).includes(value);
}

function countUnquoted(line: string, delimiter: DataCsvDelimiter): number {
  let count = 0;
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && char === delimiter) {
      count += 1;
    }
  }
  return count;
}

export function detectCsvDelimiter(text: string): DataCsvDelimiter {
  const physicalLines = text.split(/\r\n|\n|\r/).filter((line) => line.length > 0);
  const probe = physicalLines.slice(0, DATA_CSV_DELIMITER_PROBE_LINES);
  if (probe.length === 0) {
    return ",";
  }
  let best: DataCsvDelimiter = ",";
  let bestScore = -1;
  for (const delimiter of DATA_CSV_DELIMITERS) {
    const counts = probe.map((line) => countUnquoted(line, delimiter));
    const positive = counts.filter((count) => count > 0);
    if (positive.length === 0) {
      continue;
    }
    const mode = positive[0] ?? 0;
    const consistent = positive.filter((count) => count === mode).length;
    const score = consistent * 100 + mode;
    if (score > bestScore) {
      best = delimiter;
      bestScore = score;
    }
  }
  return best;
}

export function parseCsvRecords(
  text: string,
  delimiter: DataCsvDelimiter,
): DataIntakeResult<string[][]> {
  const records: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let index = 0;

  const pushField = (): DataIntakeResult<true> => {
    if (field.length > DATA_MAX_FIELD_LENGTH) {
      return dataFail("FIELD_TOO_LARGE", "A CSV field exceeds the v1 length limit");
    }
    row.push(field);
    field = "";
    if (row.length > DATA_MAX_COLUMNS) {
      return dataFail("TOO_MANY_COLUMNS", "CSV exceeds the v1 column limit");
    }
    return dataOk(true);
  };

  const pushRow = (): DataIntakeResult<true> => {
    const pushed = pushField();
    if (!pushed.ok) {
      return pushed;
    }
    if (row.length === 1 && row[0] === "" && records.length === 0) {
      row = [];
      return dataOk(true);
    }
    records.push(row);
    row = [];
    if (records.length > DATA_MAX_DATA_ROWS + 1) {
      return dataFail("TOO_MANY_ROWS", "CSV exceeds the v1 data row limit");
    }
    return dataOk(true);
  };

  while (index < text.length) {
    const char = text[index] ?? "";
    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        inQuotes = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      index += 1;
      continue;
    }
    if (char === delimiter) {
      const pushed = pushField();
      if (!pushed.ok) {
        return pushed;
      }
      index += 1;
      continue;
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
      const pushed = pushRow();
      if (!pushed.ok) {
        return pushed;
      }
      index += 1;
      continue;
    }
    field += char;
    index += 1;
  }

  if (inQuotes) {
    return dataFail("MALFORMED_CSV", "CSV quoting is not closed");
  }
  if (field.length > 0 || row.length > 0) {
    const pushed = pushRow();
    if (!pushed.ok) {
      return pushed;
    }
  }
  return dataOk(records);
}

export function parseCsvStructure(bytes: Uint8Array): DataIntakeResult<DataCsvStructureDiscovery> {
  const decoded = decodeUtf8Strict(bytes);
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
  const headerRow = records[0] ?? [];
  if (headerRow.length > DATA_MAX_COLUMNS) {
    return dataFail("TOO_MANY_COLUMNS", "CSV exceeds the v1 column limit");
  }
  for (const header of headerRow) {
    if (header.length > DATA_MAX_HEADER_LENGTH) {
      return dataFail("HEADER_INVALID", "A CSV header exceeds the v1 length limit");
    }
  }
  const dataRows = records.slice(1);
  if (dataRows.length > DATA_MAX_DATA_ROWS) {
    return dataFail("TOO_MANY_ROWS", "CSV exceeds the v1 data row limit");
  }
  const warnings: DataStructureWarningCode[] = [...collectHeaderWarnings(headerRow)];
  let emptyRowCount = 0;
  let inconsistent = false;
  for (const record of dataRows) {
    if (record.length !== headerRow.length) {
      inconsistent = true;
    }
    if (record.every((cell) => cell.trim() === "")) {
      emptyRowCount += 1;
    }
    if (record.some((cell) => cell.startsWith("="))) {
      if (!warnings.includes("FORMULA_LIKE_CELL")) {
        warnings.push("FORMULA_LIKE_CELL");
      }
    }
  }
  if (inconsistent) {
    warnings.push("INCONSISTENT_COLUMN_COUNT");
  }
  if (emptyRowCount > 0) {
    warnings.push("EMPTY_ROWS");
  }
  return dataOk({
    format: "csv",
    parserVersion: DATA_PARSER_VERSION,
    encoding: "utf-8",
    bom: decoded.value.bom,
    delimiter,
    headerRowIndex: 1,
    headers: headerRow,
    columnCount: headerRow.length,
    rowCount: dataRows.length,
    emptyRowCount,
    warnings,
  });
}

export function isSupportedCsvDelimiter(value: string): value is DataCsvDelimiter {
  return isDelimiter(value);
}
