/**
 * DATA-1I governed import planning + approval.
 * Consumes DATA-1H resolutions. No Customer writes. No execution.
 */

import { sha256Hex } from "@/features/data-intake/domain/integrity";
import {
  DATA_CUSTOMER_ADAPTER_VERSION,
  DATA_EXECUTABLE_TARGET_DOMAIN,
} from "@/features/data-intake/domain/constants";
import { DATA_CUSTOMER_MATCHER_VERSION } from "@/features/data-intake/domain/matching";
import type { DataMappingSnapshot } from "@/features/data-intake/domain/mapping";
import type {
  DataIntakeStagingRow,
  DataStagingResolution,
  DataStagingTargetOperation,
} from "@/features/data-intake/domain/staging";

export const DATA_IMPORT_PLAN_STATUSES = [
  "draft",
  "approved",
  "superseded",
  "executing",
  "executed",
] as const;

export type DataImportPlanStatus = (typeof DATA_IMPORT_PLAN_STATUSES)[number];

export type DataImportPlanOperation = {
  sourceRowNumber: number;
  rowFingerprint: string;
  lifecycle: DataIntakeStagingRow["lifecycle"];
  resolution: DataStagingResolution;
  targetOperation: DataStagingTargetOperation | null;
  targetRecordId: string | null;
};

export type DataImportPlanSummary = {
  sourceDataRows: number;
  validatedRows: number;
  createCandidates: number;
  linkCandidates: number;
  blockedRows: number;
  conflicts: number;
  noKeyRows: number;
  excludedRows: number;
  executableRows: number;
  mappingHash: string;
  matcherVersion: typeof DATA_CUSTOMER_MATCHER_VERSION;
};

export type DataImportPlanSnapshot = {
  sourceId: string;
  sourceSha256: string;
  targetDomain: typeof DATA_EXECUTABLE_TARGET_DOMAIN;
  adapterVersion: typeof DATA_CUSTOMER_ADAPTER_VERSION;
  businessActivityId: null;
  mappingSnapshot: DataMappingSnapshot;
  mappingHash: string;
  matcherVersion: typeof DATA_CUSTOMER_MATCHER_VERSION;
  includedFingerprints: string[];
  operations: DataImportPlanOperation[];
  summary: DataImportPlanSummary;
  planHash: string;
};

export function planningBlockers(rows: readonly DataIntakeStagingRow[]): {
  blockedRows: number;
  conflicts: number;
  noKeyRows: number;
  approvalBlocked: boolean;
} {
  const blockedRows = rows.filter((row) => row.lifecycle === "blocked").length;
  const conflicts = rows.filter((row) => row.resolution === "conflict").length;
  const noKeyRows = rows.filter(
    (row) => row.lifecycle === "validated" && row.resolution === "none",
  ).length;
  return {
    blockedRows,
    conflicts,
    noKeyRows,
    approvalBlocked: blockedRows + conflicts + noKeyRows > 0,
  };
}

export function executablePlanOperations(
  rows: readonly DataIntakeStagingRow[],
): DataImportPlanOperation[] {
  return [...rows]
    .filter(
      (row) =>
        row.lifecycle === "validated" &&
        ((row.resolution === "create" && row.targetOperation === "create" && !row.targetRecordId) ||
          (row.resolution === "duplicate" &&
            row.targetOperation === "link" &&
            Boolean(row.targetRecordId))),
    )
    .sort((a, b) => a.sourceRowNumber - b.sourceRowNumber)
    .map((row) => ({
      sourceRowNumber: row.sourceRowNumber,
      rowFingerprint: row.rowFingerprint,
      lifecycle: row.lifecycle,
      resolution: row.resolution,
      targetOperation: row.targetOperation,
      targetRecordId: row.targetRecordId,
    }));
}

export function summarizeImportPlan(input: {
  rows: readonly DataIntakeStagingRow[];
  operations: readonly DataImportPlanOperation[];
  mappingHash: string;
}): DataImportPlanSummary {
  const blockers = planningBlockers(input.rows);
  return {
    sourceDataRows: input.rows.length,
    validatedRows: input.rows.filter((row) => row.lifecycle === "validated").length,
    createCandidates: input.operations.filter((row) => row.targetOperation === "create").length,
    linkCandidates: input.operations.filter((row) => row.targetOperation === "link").length,
    blockedRows: blockers.blockedRows,
    conflicts: blockers.conflicts,
    noKeyRows: blockers.noKeyRows,
    excludedRows: input.rows.length - input.operations.length,
    executableRows: input.operations.length,
    mappingHash: input.mappingHash,
    matcherVersion: DATA_CUSTOMER_MATCHER_VERSION,
  };
}

export function includedFingerprints(operations: readonly DataImportPlanOperation[]): string[] {
  return [...operations.map((row) => row.rowFingerprint)].sort();
}

export function importPlanHash(input: {
  sourceSha256: string;
  mappingSnapshot: DataMappingSnapshot;
  includedFingerprints: readonly string[];
  operations: readonly DataImportPlanOperation[];
}): string {
  return sha256Hex(
    new TextEncoder().encode(
      JSON.stringify({
        source_sha256: input.sourceSha256,
        target_domain: DATA_EXECUTABLE_TARGET_DOMAIN,
        adapter_version: DATA_CUSTOMER_ADAPTER_VERSION,
        business_activity_id: null,
        mapping_snapshot: input.mappingSnapshot,
        included_fingerprints: [...input.includedFingerprints].sort(),
        matcher_version: DATA_CUSTOMER_MATCHER_VERSION,
        operations: [...input.operations]
          .sort((a, b) => a.sourceRowNumber - b.sourceRowNumber)
          .map((row) => ({
            source_row_number: row.sourceRowNumber,
            row_fingerprint: row.rowFingerprint,
            target_operation: row.targetOperation,
            target_record_id: row.targetRecordId,
          })),
      }),
    ),
  );
}

export function buildImportPlanSnapshot(input: {
  sourceId: string;
  sourceSha256: string;
  mappingSnapshot: DataMappingSnapshot;
  mappingHash: string;
  rows: readonly DataIntakeStagingRow[];
}): DataImportPlanSnapshot {
  const operations = executablePlanOperations(input.rows);
  const fingerprints = includedFingerprints(operations);
  return {
    sourceId: input.sourceId,
    sourceSha256: input.sourceSha256,
    targetDomain: DATA_EXECUTABLE_TARGET_DOMAIN,
    adapterVersion: DATA_CUSTOMER_ADAPTER_VERSION,
    businessActivityId: null,
    mappingSnapshot: input.mappingSnapshot,
    mappingHash: input.mappingHash,
    matcherVersion: DATA_CUSTOMER_MATCHER_VERSION,
    includedFingerprints: fingerprints,
    operations,
    summary: summarizeImportPlan({
      rows: input.rows,
      operations,
      mappingHash: input.mappingHash,
    }),
    planHash: importPlanHash({
      sourceSha256: input.sourceSha256,
      mappingSnapshot: input.mappingSnapshot,
      includedFingerprints: fingerprints,
      operations,
    }),
  };
}

export function persistedMatchesCurrent(input: {
  rows: readonly DataIntakeStagingRow[];
  matches: readonly {
    sourceRowNumber: number;
    resolution: DataStagingResolution;
    targetOperation: DataStagingTargetOperation | null;
    targetRecordId: string | null;
  }[];
}): boolean {
  if (input.rows.length !== input.matches.length) {
    return false;
  }
  return input.rows.every((row) => {
    const match = input.matches.find((item) => item.sourceRowNumber === row.sourceRowNumber);
    return (
      Boolean(match) &&
      match?.resolution === row.resolution &&
      match.targetOperation === row.targetOperation &&
      match.targetRecordId === row.targetRecordId
    );
  });
}

export function planSummaryForPersistence(
  snapshot: DataImportPlanSnapshot,
): Record<string, unknown> {
  return {
    source_data_rows: snapshot.summary.sourceDataRows,
    validated_rows: snapshot.summary.validatedRows,
    create_candidates: snapshot.summary.createCandidates,
    link_candidates: snapshot.summary.linkCandidates,
    blocked_rows: snapshot.summary.blockedRows,
    conflicts: snapshot.summary.conflicts,
    no_key_rows: snapshot.summary.noKeyRows,
    excluded_rows: snapshot.summary.excludedRows,
    executable_rows: snapshot.summary.executableRows,
    mapping_hash: snapshot.summary.mappingHash,
    matcher_version: snapshot.summary.matcherVersion,
    operations: snapshot.operations.map((row) => ({
      source_row_number: row.sourceRowNumber,
      row_fingerprint: row.rowFingerprint,
      lifecycle: row.lifecycle,
      resolution: row.resolution,
      target_operation: row.targetOperation,
      target_record_id: row.targetRecordId,
    })),
  };
}

export function snapshotFromPersistedPlan(input: {
  sourceId: string;
  sourceSha256: string;
  mappingSnapshot: DataMappingSnapshot;
  mappingHash: string;
  includedFingerprints: readonly string[];
  summary: Record<string, unknown>;
  planHash: string;
}): DataImportPlanSnapshot | null {
  const operationsRaw = input.summary.operations;
  if (!Array.isArray(operationsRaw)) {
    return null;
  }
  const operations = operationsRaw.flatMap((raw): DataImportPlanOperation[] => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return [];
    }
    const row = raw as Record<string, unknown>;
    if (typeof row.source_row_number !== "number" || typeof row.row_fingerprint !== "string") {
      return [];
    }
    return [
      {
        sourceRowNumber: row.source_row_number,
        rowFingerprint: row.row_fingerprint,
        lifecycle: row.lifecycle === "blocked" ? "blocked" : "validated",
        resolution: (typeof row.resolution === "string" ? row.resolution : "none") as DataImportPlanOperation["resolution"],
        targetOperation:
          row.target_operation === "create" ||
          row.target_operation === "link" ||
          row.target_operation === "skip"
            ? row.target_operation
            : null,
        targetRecordId: typeof row.target_record_id === "string" ? row.target_record_id : null,
      },
    ];
  });
  const summary = summarizeImportPlan({
    rows: [],
    operations,
    mappingHash: input.mappingHash,
  });
  return {
    sourceId: input.sourceId,
    sourceSha256: input.sourceSha256,
    targetDomain: DATA_EXECUTABLE_TARGET_DOMAIN,
    adapterVersion: DATA_CUSTOMER_ADAPTER_VERSION,
    businessActivityId: null,
    mappingSnapshot: input.mappingSnapshot,
    mappingHash: input.mappingHash,
    matcherVersion: DATA_CUSTOMER_MATCHER_VERSION,
    includedFingerprints: [...input.includedFingerprints].sort(),
    operations,
    summary: {
      ...summary,
      sourceDataRows:
        typeof input.summary.source_data_rows === "number"
          ? input.summary.source_data_rows
          : summary.sourceDataRows,
      validatedRows:
        typeof input.summary.validated_rows === "number"
          ? input.summary.validated_rows
          : summary.validatedRows,
      blockedRows:
        typeof input.summary.blocked_rows === "number"
          ? input.summary.blocked_rows
          : summary.blockedRows,
      conflicts:
        typeof input.summary.conflicts === "number" ? input.summary.conflicts : summary.conflicts,
      noKeyRows:
        typeof input.summary.no_key_rows === "number"
          ? input.summary.no_key_rows
          : summary.noKeyRows,
      excludedRows:
        typeof input.summary.excluded_rows === "number"
          ? input.summary.excluded_rows
          : summary.excludedRows,
    },
    planHash: input.planHash,
  };
}
