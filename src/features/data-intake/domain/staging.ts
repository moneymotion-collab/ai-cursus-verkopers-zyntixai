/**
 * DATA-1G staging payload, fingerprint, and summary.
 * Isolated validation buffer. Not import. Not Customer matching.
 */

import { sha256Hex } from "@/features/data-intake/domain/integrity";
import type { DataCustomerImportFieldKey } from "@/features/data-intake/domain/target-catalog";
import type { DataValidationIssue } from "@/features/data-intake/domain/validation";

export const DATA_STAGING_LIFECYCLES = ["validated", "blocked"] as const;
export type DataStagingLifecycle = (typeof DATA_STAGING_LIFECYCLES)[number];

export type DataIntakeStagingRow = {
  sourceRowNumber: number;
  rawValues: Record<string, string>;
  normalizedValues: Partial<Record<DataCustomerImportFieldKey, string | null>>;
  rowFingerprint: string;
  lifecycle: DataStagingLifecycle;
  resolution: "none";
  errorCodes: readonly string[];
  warningCodes: readonly string[];
  errorDetails: readonly DataValidationIssue[];
};

export type DataStagingSummary = {
  sourceDataRows: number;
  stagedRows: number;
  validRows: number;
  invalidRows: number;
  mappingHash: string;
  sourceSha256: string;
};

export function canonicalJsonObject(value: Record<string, string>): string {
  const keys = Object.keys(value).sort();
  const sorted: Record<string, string> = {};
  for (const key of keys) {
    sorted[key] = value[key] ?? "";
  }
  return JSON.stringify(sorted);
}

export function stagingRowFingerprint(input: {
  sourceSha256: string;
  sheetName: string | null;
  sourceRowNumber: number;
  rawValues: Record<string, string>;
}): string {
  const material = [
    input.sourceSha256,
    input.sheetName ?? "",
    String(input.sourceRowNumber),
    canonicalJsonObject(input.rawValues),
  ].join("\n");
  return sha256Hex(new TextEncoder().encode(material));
}

export function summarizeStagingRows(input: {
  sourceDataRows: number;
  rows: readonly DataIntakeStagingRow[];
  mappingHash: string;
  sourceSha256: string;
}): DataStagingSummary {
  return {
    sourceDataRows: input.sourceDataRows,
    stagedRows: input.rows.length,
    validRows: input.rows.filter((row) => row.lifecycle === "validated").length,
    invalidRows: input.rows.filter((row) => row.lifecycle === "blocked").length,
    mappingHash: input.mappingHash,
    sourceSha256: input.sourceSha256,
  };
}

export function completedStagingStatus(summary: DataStagingSummary): "review_required" | "ready_for_approval" {
  return summary.invalidRows > 0 ? "review_required" : "ready_for_approval";
}
