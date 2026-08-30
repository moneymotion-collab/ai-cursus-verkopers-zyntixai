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
} from "@/features/data-intake/domain/mapping";
import { discoveryFromPersisted } from "@/features/data-intake/domain/parse-metadata";
import { sourceColumnsFromDiscovery } from "@/features/data-intake/domain/source-column";
import { storagePathMatchesTenant } from "@/features/data-intake/domain/storage-path";
import {
  classifyIdentityResolutions,
  completedMatchingStatus,
  DATA_CUSTOMER_MATCHER_VERSION,
  stagedMatchEmail,
  summarizeIdentityResolutions,
} from "@/features/data-intake/domain/matching";
import {
  dataFail,
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import type {
  DataIntakeMatchingSuccess,
  MatchDataIntakeSourceInput,
} from "@/features/data-intake/domain/types";
import { invokeDataIntakeMatchingMutation } from "@/features/data-intake/server/data-intake-matching-rpc";
import type { DataIntakeMatchingRpcClient } from "@/features/data-intake/server/data-intake-matching-rpc";
import type { DataIntakeRecordLookup } from "@/features/data-intake/server/data-intake-lookup";
import type { DataIntakeQueryClient } from "@/features/data-intake/server/data-intake-query";
import type { DataIntakeObjectStore } from "@/features/data-intake/server/source-object-store";
import type { CustomerIdentityLookup } from "@/features/data-intake/server/customer-identity-lookup";
import {
  authorizeDataIntakeCaller,
  type DataIntakeAuthLookup,
} from "@/features/data-intake/server/tenant-authorization";

export type DataIntakeMatchingCommandDeps = {
  auth: DataIntakeAuthLookup;
  queryClient: DataIntakeQueryClient;
  lookup: DataIntakeRecordLookup;
  objectStore: DataIntakeObjectStore;
  customers: CustomerIdentityLookup;
  matchingMutate: DataIntakeMatchingRpcClient;
};

const MATCHABLE_STATUSES = new Set(["review_required", "ready_for_approval"]);

function asUnknownRecord(input: object): Record<string, unknown> {
  return input as Record<string, unknown>;
}

function clientAttemptedMatchAuthority(input: Record<string, unknown>): boolean {
  return (
    "targetRecordId" in input ||
    "target_record_id" in input ||
    "targetOperation" in input ||
    "target_operation" in input ||
    "resolution" in input ||
    "customers" in input
  );
}

export async function matchDataIntakeSourceCustomers(
  deps: DataIntakeMatchingCommandDeps,
  input: MatchDataIntakeSourceInput,
): Promise<DataIntakeResult<DataIntakeMatchingSuccess>> {
  if (clientAttemptedStorageAuthority(asUnknownRecord(input))) {
    return dataFail("SOURCE_INVALID", "Client storage path is not accepted");
  }
  if (clientAttemptedMatchAuthority(asUnknownRecord(input))) {
    return dataFail("SOURCE_INVALID", "Client matching targets are not accepted");
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
    return dataFail("TARGET_NOT_SUPPORTED", "DATA-1H matching supports customer only");
  }
  if (session.value.status === "cancelled") {
    return dataFail("INVALID_STATE", "Cancelled sessions cannot accept matching");
  }
  if (!MATCHABLE_STATUSES.has(session.value.status)) {
    return dataFail("INVALID_STATE", "Matching requires a completed staging generation");
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
    return dataFail("SOURCE_NOT_VERIFIED", "Source object must be verified before matching");
  }
  if (source.supersededAt || source.deletedAt) {
    return dataFail("INVALID_STATE", "Superseded or deleted sources cannot be matched");
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
  if (!persisted) {
    return dataFail("INVALID_STATE", "Persisted source structure is not usable for matching");
  }
  const confirmed = decisions.value.filter(
    (row) => row.status === "confirmed" || row.status === "rejected",
  );
  if (confirmed.filter((row) => row.status === "confirmed").length === 0) {
    return dataFail("MAPPING_INCOMPLETE", "Matching requires a confirmed mapping");
  }
  const mappingHash = mappingSnapshotHash(
    canonicalizeMappingSnapshot({
      columns: sourceColumnsFromDiscovery(persisted),
      decisions: confirmed,
    }),
  );
  if (input.mappingHash && input.mappingHash !== mappingHash) {
    return dataFail("MAPPING_HASH_MISMATCH", "Matching is bound to the current confirmed mapping hash");
  }

  const staged = await deps.lookup.findStaging({
    organizationId: authorized.value.organizationId,
    sourceId: source.id,
  });
  if (!staged.ok) {
    return staged;
  }
  if (staged.value.length === 0) {
    return dataFail("INVALID_STATE", "Matching requires completed staging rows");
  }

  const emails = staged.value
    .filter((row) => row.lifecycle === "validated")
    .map(stagedMatchEmail)
    .filter((value): value is string => Boolean(value));
  const candidates = await deps.customers.findByOrganizationEmails({
    organizationId: authorized.value.organizationId,
    emails,
  });
  if (!candidates.ok) {
    return candidates;
  }
  const matches = classifyIdentityResolutions({
    organizationId: authorized.value.organizationId,
    rows: staged.value,
    candidates: candidates.value,
  });
  const summary = summarizeIdentityResolutions(matches);
  const computedStatus = completedMatchingStatus({
    rows: staged.value,
    matches,
  });
  const nextStatus =
    session.value.status === "review_required" ? "review_required" : computedStatus;

  const mutated = await invokeDataIntakeMatchingMutation(deps.matchingMutate, {
    p_operation: "confirm_source_matching",
    p_organization_id: authorized.value.organizationId,
    p_actor_user_id: authorized.value.userId,
    p_actor_member_id: authorized.value.membershipId,
    p_payload: {
      session_id: input.sessionId,
      source_id: source.id,
      mapping_hash: mappingHash,
      source_sha256: digest,
      matcher_version: DATA_CUSTOMER_MATCHER_VERSION,
      next_status: nextStatus,
      eligible_rows: summary.eligibleRows,
      exact_matches: summary.exactMatches,
      no_matches: summary.noMatches,
      no_key_rows: summary.noKeyRows,
      ambiguous_rows: summary.ambiguousRows,
      collisions: summary.collisions,
      blocked_skipped: summary.blockedSkipped,
      match_rows: matches.map((row) => ({
        source_row_number: row.sourceRowNumber,
        resolution: row.resolution,
        target_operation: row.targetOperation,
        target_record_id: row.targetRecordId,
        match_kind: row.matchKind,
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
    matcherVersion: DATA_CUSTOMER_MATCHER_VERSION,
    summary: mutated.value.summary ?? summary,
    rows: persistedRows.value,
  });
}

export async function listDataIntakeMatchingState(
  deps: DataIntakeMatchingCommandDeps,
  input: MatchDataIntakeSourceInput,
): Promise<DataIntakeResult<DataIntakeMatchingSuccess>> {
  if (clientAttemptedStorageAuthority(asUnknownRecord(input))) {
    return dataFail("SOURCE_INVALID", "Client storage path is not accepted");
  }
  if (clientAttemptedMatchAuthority(asUnknownRecord(input))) {
    return dataFail("SOURCE_INVALID", "Client matching targets are not accepted");
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
  const rows = await deps.lookup.findStaging({
    organizationId: authorized.value.organizationId,
    sourceId: source.id,
  });
  if (!rows.ok) {
    return rows;
  }
  const emails = rows.value
    .filter((row) => row.lifecycle === "validated")
    .map(stagedMatchEmail)
    .filter((value): value is string => Boolean(value));
  const candidates = await deps.customers.findByOrganizationEmails({
    organizationId: authorized.value.organizationId,
    emails,
  });
  if (!candidates.ok) {
    return candidates;
  }
  const matches = classifyIdentityResolutions({
    organizationId: authorized.value.organizationId,
    rows: rows.value,
    candidates: candidates.value,
  });
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
    mappingHash: input.mappingHash ?? null,
    sourceSha256: source.sha256,
    matcherVersion: DATA_CUSTOMER_MATCHER_VERSION,
    summary: summarizeIdentityResolutions(matches),
    rows: rows.value,
  });
}
