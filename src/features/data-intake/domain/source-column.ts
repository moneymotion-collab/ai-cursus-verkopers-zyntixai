/**
 * DATA-1F source-column identity.
 * Header text is not identity. Duplicate/empty headers stay distinct by ordinal.
 */

import type { DataSourceStructureDiscovery } from "@/features/data-intake/domain/discovery";

export type DataSourceColumnIdentity = {
  key: string;
  header: string;
  index: number;
  sheetName: string | null;
};

const CSV_KEY = /^csv:(\d+)$/;
const XLSX_KEY = /^xlsx:(\d+):(.+)$/;

export function sourceColumnKey(input: {
  format: "csv" | "xlsx";
  index: number;
  sheetName?: string | null;
}): string {
  if (input.format === "xlsx") {
    return `xlsx:${input.index}:${input.sheetName ?? ""}`;
  }
  return `csv:${input.index}`;
}

export function sourceColumnsFromDiscovery(
  discovery: DataSourceStructureDiscovery,
): DataSourceColumnIdentity[] {
  const sheetName = discovery.format === "xlsx" ? discovery.selectedSheet : null;
  return discovery.headers.map((header, index) => ({
    key: sourceColumnKey({
      format: discovery.format,
      index,
      sheetName,
    }),
    header,
    index,
    sheetName,
  }));
}

export function findSourceColumn(
  discovery: DataSourceStructureDiscovery,
  sourceFieldKey: string,
): DataSourceColumnIdentity | null {
  return (
    sourceColumnsFromDiscovery(discovery).find((column) => column.key === sourceFieldKey) ?? null
  );
}

export function isWellFormedSourceColumnKey(value: string): boolean {
  return CSV_KEY.test(value) || XLSX_KEY.test(value);
}
