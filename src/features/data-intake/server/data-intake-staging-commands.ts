import "server-only";

import { canPerformDataIntakeFoundationCommand } from "@/features/data-intake/domain/authorization";
import {
  DATA_EXECUTABLE_TARGET_DOMAIN,
  DATA_INTAKE_STORAGE_BUCKET,
  DATA_SHA256_PATTERN,
  isDataUuid,
} from "@/features/data-intake/domain/constants";
import { clientAttemptedStorageAuthority } from "@/features/data-intake/domain/client-path-authority";
import { sha256Hex } from "@/features/data-intake/domain/integrity";
import {
  canonicalizeMappingSnapshot,
  mappingSnapshotHash,
  type DataIntakeMappingRow,
} from "@/features/data-intake/domain/mapping";
import { coverageForDecision } from "@/features/data-intake/domain/mapping";
import { discoveryFromPersisted } from "@/features/data-intake/domain/parse-metadata";
import { canonicalStructureFingerprint } from "@/features/data-intake/domain/discovery";
import { parseSourceStructure } from "@/features/data-intake/domain/parse-source-structure";
import { parseSourceDataRows } from "@/features/data-intake/domain/source-rows";
import { sourceColumnsFromDiscovery } from "@/features/data-intake/domain/source-column";
import { storagePathMatchesTenant } from "@/features/data-intake/domain/storage-path";
import {
  completedStagingStatus,
  stagingRowFingerprint,
  summarizeStagingRows,
  type DataIntakeStagingRow,
} from "@/features/data-intake/domain/staging";
import { validateMappedTargetValue } from "@/features/data-intake/domain/validation";
import {
  isExcludedCustomerImportField,
  resolveCustomerImportField,
} from "@/features/data-intake/domain/target-catalog";
import {
  dataFail,
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import type {
  DataIntakeStagingSuccess,
  ValidateDataIntakeSourceInput,
} from "@/features/data-intake/domain/types";
import { invokeDataIntakeStagingMutation } from "@/features/data-intake/server/data-intake-staging-rpc";
import type { DataIntakeStagingRpcClient } from "@/features/data-intake/server/data-intake-staging-rpc";
import type { DataIntakeRecordLookup } from "@/features/data-intake/server/data-intake-lookup";
import type { DataIntakeQueryClient } from "@/features/data-intake/server/data-intake-query";
import type { DataIntakeObjectStore } from "@/features/data-intake/server/source-object-store";
import {
  authorizeDataIntakeCaller,
  type DataIntakeAuthLookup,
} from "@/features/data-intake/server/tenant-authorization";

export type DataIntakeStagingCommandDeps = {
  auth: DataIntakeAuthLookup;
  queryClient: DataIntakeQueryClient;
  lookup: DataIntakeRecordLookup;
  objectStore: DataIntakeObjectStore;
  stagingMutate: DataIntakeStagingRpcClient;
};

const STAGEABLE_STATUSES = new Set([
  "mapped",
  "validating",
  "review_required",
  "ready_for_approval",
]);

function asUnknownRecord(input: object): Record<string, unknown> {
  return input as Record<string, unknown>;
}

function buildStagedRows(input: {
  columns: ReturnType<typeof sourceColumnsFromDiscovery>;
  decisions: readonly DataIntakeMappingRow[];
  rows: readonly { sourceRowNumber: number; sheetName: string | null; values: readonly string[] }[];
  sourceSha256: string;
}): DataIntakeResult<DataIntakeStagingRow[]> {
  const mapped = input.decisions.filter(
    (decision) => coverageForDecision(decision) === "mapped" && decision.targetField,
  );
  for (const decision of mapped) {
    const targetField = decision.targetField ?? "";
    if (!resolveCustomerImportField(DATA_EXECUTABLE_TARGET_DOMAIN, targetField)) {
      return dataFail(
        isExcludedCustomerImportField(targetField) ? "TARGET_FIELD_FORBIDDEN" : "TARGET_FIELD_UNKNOWN",
        "Confirmed mapping is inconsistent with the target catalog",
      );
    }
  }

  const staged: DataIntakeStagingRow[] = [];
  for (const row of input.rows) {
    const rawValues: Record<string, string> = {};
    const normalizedValues: DataIntakeStagingRow["normalizedValues"] = {};
    const issues: DataIntakeStagingRow["errorDetails"][number][] = [];
    for (const decision of mapped) {
      const column = input.columns.find((item) => item.key === decision.sourceFieldKey);
      if (!column || !decision.targetField) {
        return dataFail("SOURCE_COLUMN_UNKNOWN", "Confirmed mapping references an unknown source column");
      }
      const raw = row.values[column.index] ?? "";
      rawValues[decision.sourceFieldKey] = raw;
      const validated = validateMappedTargetValue({
        targetField: decision.targetField,
        raw,
      });
      if (!validated.ok) {
        return dataFail(validated.code, "Confirmed mapping is inconsistent with the target catalog");
      }
      normalizedValues[validated.field] = validated.normalized;
      issues.push(...validated.issues);
    }
    const blocked = issues.length > 0;
    staged.push({
      sourceRowNumber: row.sourceRowNumber,
      rawValues,
      normalizedValues,
      rowFingerprint: stagingRowFingerprint({
        sourceSha256: input.sourceSha256,
        sheetName: row.sheetName,
        sourceRowNumber: row.sourceRowNumber,
        rawValues,
      }),
      lifecycle: blocked ? "blocked" : "validated",
      resolution: "none",
      errorCodes: issues.map((item) => item.code),
      warningCodes: [],
      errorDetails: issues,
    });
  }
  return dataOk(staged);
}

export async function validateAndStageDataIntakeSource(
  deps: DataIntakeStagingCommandDeps,
  input: ValidateDataIntakeSourceInput,
): Promise<DataIntakeResult<DataIntakeStagingSuccess>> {
  if (clientAttemptedStorageAuthority(asUnknownRecord(input))) {
    return dataFail("SOURCE_INVALID", "Client storage path is not accepted");
  }
  const authorized = await authorizeDataIntakeCaller({
    auth: deps.auth,
    queryClient: deps.queryClient,
    organizationId: input.organizationId,
  });
  if (!authorized.ok) {
    return authorized;
  }
  if (!canPerformDataIntakeFoundationCommand(authorized.value.role)) {
    return dataFail("FORBIDDEN_ROLE", "Owner or Admin role is required");
  }
  if (!isDataUuid(input.sessionId)) {
    return dataFail("SESSION_NOT_FOUND", "sessionId is required");
  }
  if (input.sourceId && !isDataUuid(input.sourceId)) {
    return dataFail("SOURCE_NOT_FOUND", "sourceId is required");
  }
  if (input.mappingHash && !DATA_SHA256_PATTERN.test(input.mappingHash)) {
    return dataFail("MAPPING_HASH_MISMATCH", "mappingHash must be the current confirmed mapping digest");
  }

  const session = await deps.lookup.findSession({
    organizationId: authorized.value.organizationId,
    sessionId: input.sessionId,
  });
  if (!session.ok) {
    return session;
  }
  if (!session.value) {
    return dataFail("SESSION_NOT_FOUND", "Intake session not found");
  }
  if (session.value.targetDomain !== DATA_EXECUTABLE_TARGET_DOMAIN) {
    return dataFail("TARGET_NOT_SUPPORTED", "DATA-1G staging supports customer only");
  }
  if (session.value.status === "cancelled") {
    return dataFail("INVALID_STATE", "Cancelled sessions cannot accept validation");
  }
  if (!STAGEABLE_STATUSES.has(session.value.status)) {
    return dataFail("INVALID_STATE", "Validation requires a confirmed mapped session");
  }

  const sourceResult = input.sourceId
    ? await deps.lookup.findSource({
        organizationId: authorized.value.organizationId,
        sourceId: input.sourceId,
      })
    : await deps.lookup.findActiveSource({
        organizationId: authorized.value.organizationId,
        sessionId: input.sessionId,
      });
  if (!sourceResult.ok) {
    return sourceResult;
  }
  const source = sourceResult.value;
  if (!source || source.sessionId !== input.sessionId) {
    return dataFail("SOURCE_NOT_FOUND", "Intake source not found for this session");
  }
  if (!source.objectVerifiedAt) {
    return dataFail("SOURCE_NOT_VERIFIED", "Source object must be verified before validation");
  }
  if (source.supersededAt || source.deletedAt) {
    return dataFail("INVALID_STATE", "Superseded or deleted sources cannot be staged");
  }
  if (source.headerRowIndex === null) {
    return dataFail("INVALID_STATE", "Validation requires completed structure discovery");
  }
  if (source.storageBucket !== DATA_INTAKE_STORAGE_BUCKET) {
    return dataFail("DATABASE_WRITE_ERROR", "Unexpected storage bucket");
  }
  if (
    !storagePathMatchesTenant({
      path: source.storagePath,
      organizationId: authorized.value.organizationId,
      sessionId: input.sessionId,
    })
  ) {
    return dataFail("DATABASE_WRITE_ERROR", "Generated storage path failed tenant check");
  }

  const stored = await deps.objectStore.getObject({
    bucket: source.storageBucket,
    path: source.storagePath,
  });
  if (!stored.ok) {
    return stored;
  }
  if (stored.value.bytes.byteLength !== source.byteSize) {
    return dataFail("SOURCE_HASH_INVALID", "Stored object no longer matches the verified source");
  }
  const digest = sha256Hex(stored.value.bytes);
  if (digest !== source.sha256) {
    return dataFail("SOURCE_HASH_INVALID", "Stored object no longer matches the verified source");
  }

  const structure = await parseSourceStructure({
    kind: source.sourceKind,
    bytes: stored.value.bytes,
  });
  if (!structure.ok) {
    return structure;
  }
  const persisted = discoveryFromPersisted({
    sourceKind: source.sourceKind,
    encoding: source.encoding,
    delimiter: source.delimiter,
    sheetName: source.sheetName,
    headerRowIndex: source.headerRowIndex,
    rowCount: source.rowCount,
    columnCount: source.columnCount,
    parseMetadata: source.parseMetadata,
  });
  if (!persisted) {
    return dataFail("INVALID_STATE", "Persisted source structure is not usable for validation");
  }
  if (canonicalStructureFingerprint(persisted) !== canonicalStructureFingerprint(structure.value)) {
    return dataFail("SOURCE_INVALID", "Source structure no longer matches the verified discovery");
  }

  const decisions = await deps.lookup.findMappings({
    organizationId: authorized.value.organizationId,
    sourceId: source.id,
  });
  if (!decisions.ok) {
    return decisions;
  }
  const columns = sourceColumnsFromDiscovery(structure.value);
  const confirmed = decisions.value.filter(
    (row) => row.status === "confirmed" || row.status === "rejected",
  );
  if (confirmed.filter((row) => row.status === "confirmed").length === 0) {
    return dataFail("MAPPING_INCOMPLETE", "Validation requires a confirmed mapping");
  }
  const snapshot = canonicalizeMappingSnapshot({
    columns,
    decisions: confirmed,
  });
  const mappingHash = mappingSnapshotHash(snapshot);
  if (input.mappingHash && input.mappingHash !== mappingHash) {
    return dataFail("MAPPING_HASH_MISMATCH", "Staging is bound to the current confirmed mapping hash");
  }

  const parsedRows = await parseSourceDataRows({
    kind: source.sourceKind,
    bytes: stored.value.bytes,
  });
  if (!parsedRows.ok) {
    return parsedRows;
  }
  const staged = buildStagedRows({
    columns,
    decisions: confirmed,
    rows: parsedRows.value.rows,
    sourceSha256: digest,
  });
  if (!staged.ok) {
    return staged;
  }
  const summary = summarizeStagingRows({
    sourceDataRows: parsedRows.value.rows.length,
    rows: staged.value,
    mappingHash,
    sourceSha256: digest,
  });
  const nextStatus = completedStagingStatus(summary);

  const mutated = await invokeDataIntakeStagingMutation(deps.stagingMutate, {
    p_operation: "confirm_source_validation",
    p_organization_id: authorized.value.organizationId,
    p_actor_user_id: authorized.value.userId,
    p_actor_member_id: authorized.value.membershipId,
    p_payload: {
      session_id: input.sessionId,
      source_id: source.id,
      mapping_hash: mappingHash,
      source_sha256: digest,
      next_status: nextStatus,
      source_data_rows: summary.sourceDataRows,
      valid_rows: summary.validRows,
      invalid_rows: summary.invalidRows,
      staging_rows: staged.value.map((row) => ({
        source_row_number: row.sourceRowNumber,
        raw_values: row.rawValues,
        normalized_values: row.normalizedValues,
        row_fingerprint: row.rowFingerprint,
        lifecycle: row.lifecycle,
        resolution: row.resolution,
        error_codes: row.errorCodes,
        warning_codes: row.warningCodes,
        error_details: row.errorDetails,
      })),
    },
  });
  if (!mutated.ok) {
    return mutated;
  }
  const persistedRows = await deps.lookup.findStaging({
    organizationId: authorized.value.organizationId,
    sourceId: source.id,
  });
  if (!persistedRows.ok) {
    return persistedRows;
  }
  return dataOk({
    sessionId: mutated.value.sessionId,
    status: mutated.value.status,
    targetDomain: mutated.value.targetDomain,
    sourceKind: mutated.value.sourceKind ?? source.sourceKind,
    sourceId: mutated.value.sourceId,
    storagePath: mutated.value.storagePath,
    storageBucket: mutated.value.storageBucket,
    eventId: mutated.value.eventId,
    eventType: mutated.value.eventType,
    replayed: mutated.value.replayed,
    mappingHash,
    sourceSha256: digest,
    summary: mutated.value.summary ?? summary,
    rows: persistedRows.value,
  });
}

export async function listDataIntakeStagingState(
  deps: DataIntakeStagingCommandDeps,
  input: ValidateDataIntakeSourceInput,
): Promise<DataIntakeResult<DataIntakeStagingSuccess>> {
  const authorized = await authorizeDataIntakeCaller({
    auth: deps.auth,
    queryClient: deps.queryClient,
    organizationId: input.organizationId,
  });
  if (!authorized.ok) {
    return authorized;
  }
  if (!canPerformDataIntakeFoundationCommand(authorized.value.role)) {
    return dataFail("FORBIDDEN_ROLE", "Owner or Admin role is required");
  }
  if (!isDataUuid(input.sessionId)) {
    return dataFail("SESSION_NOT_FOUND", "sessionId is required");
  }
  const session = await deps.lookup.findSession({
    organizationId: authorized.value.organizationId,
    sessionId: input.sessionId,
  });
  if (!session.ok) {
    return session;
  }
  if (!session.value) {
    return dataFail("SESSION_NOT_FOUND", "Intake session not found");
  }
  const sourceResult = input.sourceId
    ? await deps.lookup.findSource({
        organizationId: authorized.value.organizationId,
        sourceId: input.sourceId,
      })
    : await deps.lookup.findActiveSource({
        organizationId: authorized.value.organizationId,
        sessionId: input.sessionId,
      });
  if (!sourceResult.ok) {
    return sourceResult;
  }
  const source = sourceResult.value;
  if (!source || source.sessionId !== input.sessionId) {
    return dataFail("SOURCE_NOT_FOUND", "Intake source not found for this session");
  }
  const authoritative =
    session.value.status === "review_required" || session.value.status === "ready_for_approval";
  const rows = authoritative
    ? await deps.lookup.findStaging({
        organizationId: authorized.value.organizationId,
        sourceId: source.id,
      })
    : dataOk([]);
  if (!rows.ok) {
    return rows;
  }
  const decisions = await deps.lookup.findMappings({
    organizationId: authorized.value.organizationId,
    sourceId: source.id,
  });
  if (!decisions.ok) {
    return decisions;
  }
  const persisted = discoveryFromPersisted({
    sourceKind: source.sourceKind,
    encoding: source.encoding,
    delimiter: source.delimiter,
    sheetName: source.sheetName,
    headerRowIndex: source.headerRowIndex,
    rowCount: source.rowCount,
    columnCount: source.columnCount,
    parseMetadata: source.parseMetadata,
  });
  const mappingHash =
    persisted && decisions.value.some((row) => row.status === "confirmed")
      ? mappingSnapshotHash(
          canonicalizeMappingSnapshot({
            columns: sourceColumnsFromDiscovery(persisted),
            decisions: decisions.value.filter(
              (row) => row.status === "confirmed" || row.status === "rejected",
            ),
          }),
        )
      : (input.mappingHash ?? null);
  return dataOk({
    sessionId: session.value.id,
    status: session.value.status,
    targetDomain: session.value.targetDomain,
    sourceKind: session.value.sourceKind,
    sourceId: source.id,
    storagePath: source.storagePath,
    storageBucket: source.storageBucket,
    eventId: null,
    eventType: null,
    mappingHash,
    sourceSha256: source.sha256,
    summary: summarizeStagingRows({
      sourceDataRows: source.rowCount ?? rows.value.length,
      rows: rows.value,
      mappingHash: mappingHash ?? "",
      sourceSha256: source.sha256,
    }),
    rows: rows.value,
  });
}
