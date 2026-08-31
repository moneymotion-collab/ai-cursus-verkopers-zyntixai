/**
 * DATA-1J governed Customer import execution + row-result foundation.
 * Create and link only. link is not update. No merge, delete, or external links.
 */

import { DATA_EXECUTABLE_TARGET_DOMAIN } from "@/features/data-intake/domain/constants";
import type { DataCustomerImportFieldKey } from "@/features/data-intake/domain/target-catalog";
import { DATA_CUSTOMER_IMPORT_FIELD_KEYS } from "@/features/data-intake/domain/target-catalog";

export const DATA_IMPORT_ROW_OPERATIONS = ["create", "link", "skip"] as const;
export const DATA_IMPORT_ROW_OUTCOMES = ["imported", "failed", "skipped"] as const;

export type DataImportRowOperation = (typeof DATA_IMPORT_ROW_OPERATIONS)[number];
export type DataImportRowOutcome = (typeof DATA_IMPORT_ROW_OUTCOMES)[number];

export type DataImportRowResultView = {
  rowFingerprint: string;
  sourceRowNumber: number;
  operation: DataImportRowOperation;
  outcome: DataImportRowOutcome;
  targetDomain: typeof DATA_EXECUTABLE_TARGET_DOMAIN;
  targetRecordId: string | null;
  errorCode: string | null;
};

export type DataImportExecutionSummary = {
  imported: number;
  failed: number;
  skipped: number;
  created: number;
  linked: number;
};

export type ImportableCustomerFields = {
  display_name: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
};

function optionalImportField(
  normalized: Record<string, string | null | undefined>,
  key: Exclude<DataCustomerImportFieldKey, "display_name">,
  maxLength: number,
): string | null {
  const value = normalized[key];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed.length <= maxLength ? trimmed : null;
}

export function importableCustomerFields(
  normalized: Record<string, string | null | undefined>,
): { ok: true; fields: ImportableCustomerFields } | { ok: false } {
  const displayRaw =
    typeof normalized.display_name === "string" ? normalized.display_name.trim() : "";
  if (displayRaw.length < 1 || displayRaw.length > 200) {
    return { ok: false };
  }
  return {
    ok: true,
    fields: {
      display_name: displayRaw,
      email: optionalImportField(normalized, "email", 200),
      phone: optionalImportField(normalized, "phone", 50),
      first_name: optionalImportField(normalized, "first_name", 200),
      last_name: optionalImportField(normalized, "last_name", 200),
    },
  };
}

export function summarizeExecutionResults(
  results: readonly DataImportRowResultView[],
): DataImportExecutionSummary {
  return {
    imported: results.filter((row) => row.outcome === "imported").length,
    failed: results.filter((row) => row.outcome === "failed").length,
    skipped: results.filter((row) => row.outcome === "skipped").length,
    created: results.filter((row) => row.operation === "create" && row.outcome === "imported").length,
    linked: results.filter((row) => row.operation === "link" && row.outcome === "imported").length,
  };
}

export function isImportableCustomerFieldKey(value: string): value is DataCustomerImportFieldKey {
  return (DATA_CUSTOMER_IMPORT_FIELD_KEYS as readonly string[]).includes(value);
}
