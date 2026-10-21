/**
 * DATA-1F mapping decisions, completeness, and canonical snapshot.
 * Structure only. No value inspection. No AI. No Customer writes.
 */

import { sha256Hex } from "@/features/data-intake/domain/integrity";
import {
  DATA_CUSTOMER_ADAPTER_VERSION,
  DATA_EXECUTABLE_TARGET_DOMAIN,
} from "@/features/data-intake/domain/constants";
import type { DataSourceColumnIdentity } from "@/features/data-intake/domain/source-column";
import {
  isExcludedCustomerImportField,
  requiredCustomerImportFieldKeys,
  resolveCustomerImportField,
  type DataCustomerImportFieldKey,
} from "@/features/data-intake/domain/target-catalog";

export const DATA_MAPPING_DECISION_STATUSES = [
  "proposed",
  "confirmed",
  "rejected",
  "unmapped",
  "needs_review",
] as const;

export type DataMappingDecisionStatus = (typeof DATA_MAPPING_DECISION_STATUSES)[number];

export const DATA_MAPPING_COVERAGE = ["mapped", "ignored", "unresolved"] as const;
export type DataMappingCoverage = (typeof DATA_MAPPING_COVERAGE)[number];

export type DataIntakeMappingRow = {
  sourceFieldKey: string;
  sourceHeader: string;
  targetField: string | null;
  status: DataMappingDecisionStatus;
};

export type DataMappingCoverageRow = {
  sourceFieldKey: string;
  sourceHeader: string;
  coverage: DataMappingCoverage;
  targetField: string | null;
  status: DataMappingDecisionStatus | null;
};

export type DataMappingCompleteness = {
  mapped: number;
  ignored: number;
  unresolved: number;
  requiredTargetsMapped: boolean;
  missingRequiredTargets: DataCustomerImportFieldKey[];
  confirmable: boolean;
  columns: DataMappingCoverageRow[];
};

export type DataMappingSnapshotEntry = {
  sourceFieldKey: string;
  sourceHeader: string;
  targetField: string | null;
  status: "confirmed" | "rejected" | "unmapped";
};

export type DataMappingSnapshot = {
  adapterVersion: typeof DATA_CUSTOMER_ADAPTER_VERSION;
  targetDomain: typeof DATA_EXECUTABLE_TARGET_DOMAIN;
  decisions: DataMappingSnapshotEntry[];
};

export function coverageForDecision(
  decision: DataIntakeMappingRow | null,
): DataMappingCoverage {
  if (!decision) {
    return "unresolved";
  }
  if (decision.status === "rejected") {
    return "ignored";
  }
  if (
    (decision.status === "proposed" || decision.status === "confirmed") &&
    decision.targetField
  ) {
    return "mapped";
  }
  return "unresolved";
}

export function evaluateMappingCompleteness(input: {
  columns: readonly DataSourceColumnIdentity[];
  decisions: readonly DataIntakeMappingRow[];
}): DataMappingCompleteness {
  const byKey = new Map(input.decisions.map((row) => [row.sourceFieldKey, row]));
  const columns = input.columns.map((column) => {
    const decision = byKey.get(column.key) ?? null;
    return {
      sourceFieldKey: column.key,
      sourceHeader: column.header,
      coverage: coverageForDecision(decision),
      targetField: decision?.targetField ?? null,
      status: decision?.status ?? null,
    };
  });
  const mappedTargets = new Set(
    columns
      .filter((row) => row.coverage === "mapped" && row.targetField)
      .map((row) => row.targetField as string),
  );
  const missingRequiredTargets = requiredCustomerImportFieldKeys().filter(
    (key) => !mappedTargets.has(key),
  );
  return {
    mapped: columns.filter((row) => row.coverage === "mapped").length,
    ignored: columns.filter((row) => row.coverage === "ignored").length,
    unresolved: columns.filter((row) => row.coverage === "unresolved").length,
    requiredTargetsMapped: missingRequiredTargets.length === 0,
    missingRequiredTargets,
    confirmable: missingRequiredTargets.length === 0,
    columns,
  };
}

export function duplicateTargetField(
  decisions: readonly DataIntakeMappingRow[],
  nextSourceFieldKey: string,
  nextTargetField: string,
): DataIntakeMappingRow | null {
  return (
    decisions.find(
      (row) =>
        row.sourceFieldKey !== nextSourceFieldKey &&
        row.targetField === nextTargetField &&
        (row.status === "proposed" || row.status === "confirmed"),
    ) ?? null
  );
}

export function validateMappingTarget(input: {
  targetDomain: string;
  targetField: string;
}): "ok" | "TARGET_NOT_SUPPORTED" | "TARGET_FIELD_UNKNOWN" | "TARGET_FIELD_FORBIDDEN" {
  if (input.targetDomain !== DATA_EXECUTABLE_TARGET_DOMAIN) {
    return "TARGET_NOT_SUPPORTED";
  }
  if (resolveCustomerImportField(input.targetDomain, input.targetField)) {
    return "ok";
  }
  if (isExcludedCustomerImportField(input.targetField)) {
    return "TARGET_FIELD_FORBIDDEN";
  }
  return "TARGET_FIELD_UNKNOWN";
}

export function canonicalizeMappingSnapshot(input: {
  columns: readonly DataSourceColumnIdentity[];
  decisions: readonly DataIntakeMappingRow[];
}): DataMappingSnapshot {
  const byKey = new Map(input.decisions.map((row) => [row.sourceFieldKey, row]));
  const decisions = [...input.columns]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((column): DataMappingSnapshotEntry => {
      const decision = byKey.get(column.key);
      if (decision?.status === "rejected") {
        return {
          sourceFieldKey: column.key,
          sourceHeader: column.header,
          targetField: null,
          status: "rejected",
        };
      }
      if (
        decision &&
        (decision.status === "proposed" || decision.status === "confirmed") &&
        decision.targetField
      ) {
        return {
          sourceFieldKey: column.key,
          sourceHeader: column.header,
          targetField: decision.targetField,
          status: "confirmed",
        };
      }
      return {
        sourceFieldKey: column.key,
        sourceHeader: column.header,
        targetField: null,
        status: "unmapped",
      };
    });
  return {
    adapterVersion: DATA_CUSTOMER_ADAPTER_VERSION,
    targetDomain: DATA_EXECUTABLE_TARGET_DOMAIN,
    decisions,
  };
}

export function mappingSnapshotHash(snapshot: DataMappingSnapshot): string {
  return sha256Hex(new TextEncoder().encode(JSON.stringify(snapshot)));
}
