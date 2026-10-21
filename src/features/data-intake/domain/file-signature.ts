import {
  DATA_CSV_MIME,
  DATA_XLSX_MIME,
  type DataSourceKind,
} from "@/features/data-intake/domain/constants";

const OLE_COMPOUND = [0xd0, 0xcf, 0x11, 0xe0];
const ZIP_LOCAL = [0x50, 0x4b, 0x03, 0x04];
const ZIP_EMPTY = [0x50, 0x4b, 0x05, 0x06];
const ZIP_SPANNED = [0x50, 0x4b, 0x07, 0x08];

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) {
    return false;
  }
  return signature.every((value, index) => bytes[index] === value);
}

export function normalizeDataIntakeMime(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  const [rawType, ...params] = trimmed.split(";").map((part) => part.trim());
  if (!rawType) {
    return null;
  }
  if (rawType === DATA_CSV_MIME) {
    if (
      params.some((param) => param && !param.startsWith("charset="))
    ) {
      return null;
    }
    return DATA_CSV_MIME;
  }
  if (rawType === DATA_XLSX_MIME) {
    if (params.length > 0 && params.some(Boolean)) {
      return null;
    }
    return DATA_XLSX_MIME;
  }
  return null;
}

export function extensionMatchesSourceKind(
  filename: string,
  kind: DataSourceKind,
): boolean {
  const lower = filename.trim().toLowerCase();
  if (kind === "csv") {
    return lower.endsWith(".csv") && !lower.endsWith(".xlsx.csv");
  }
  return lower.endsWith(".xlsx");
}

export function looksLikeLegacyXls(bytes: Uint8Array): boolean {
  return startsWith(bytes, OLE_COMPOUND);
}

export function looksLikeZipContainer(bytes: Uint8Array): boolean {
  return (
    startsWith(bytes, ZIP_LOCAL) ||
    startsWith(bytes, ZIP_EMPTY) ||
    startsWith(bytes, ZIP_SPANNED)
  );
}

export function containsNul(bytes: Uint8Array): boolean {
  return bytes.includes(0);
}

export function inspectSourceBytes(input: {
  kind: DataSourceKind;
  bytes: Uint8Array;
}): "ok" | "legacy_xls" | "zip_disguised_as_csv" | "binary_csv" | "not_xlsx" {
  if (looksLikeLegacyXls(input.bytes)) {
    return "legacy_xls";
  }
  if (input.kind === "csv") {
    if (looksLikeZipContainer(input.bytes)) {
      return "zip_disguised_as_csv";
    }
    if (containsNul(input.bytes)) {
      return "binary_csv";
    }
    return "ok";
  }
  if (!looksLikeZipContainer(input.bytes)) {
    return "not_xlsx";
  }
  return "ok";
}
