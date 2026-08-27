export const DATA_INTAKE_STORAGE_BUCKET = "data-intake" as const;
export const DATA_INTAKE_SIGNED_READ_TTL_SECONDS = 60;

export const DATA_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const DATA_MAX_DATA_ROWS = 10_000;
export const DATA_MAX_COLUMNS = 50;
export const DATA_SYNC_MAX_ROWS = 500;
export const DATA_SYNC_MAX_BYTES = 2 * 1024 * 1024;
export const DATA_BATCH_SIZE = 100;

export const DATA_EXECUTABLE_TARGET_DOMAIN = "customer" as const;
export const DATA_CUSTOMER_ADAPTER_VERSION = "customer.v1" as const;

export const DATA_SOURCE_KINDS = ["csv", "xlsx"] as const;
export type DataSourceKind = (typeof DATA_SOURCE_KINDS)[number];

export const DATA_CSV_MIME = "text/csv" as const;
export const DATA_XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" as const;

export const DATA_SHA256_PATTERN = /^[0-9a-f]{64}$/;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isDataUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function isDataSourceKind(value: string): value is DataSourceKind {
  return (DATA_SOURCE_KINDS as readonly string[]).includes(value);
}

export function extensionForSourceKind(kind: DataSourceKind): ".csv" | ".xlsx" {
  return kind === "csv" ? ".csv" : ".xlsx";
}

export function mimeForSourceKind(kind: DataSourceKind): string {
  return kind === "csv" ? DATA_CSV_MIME : DATA_XLSX_MIME;
}
