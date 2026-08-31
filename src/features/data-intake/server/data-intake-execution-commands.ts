import "server-only";

import { canPerformDataIntakeFoundationCommand } from "@/features/data-intake/domain/authorization";
import {
  DATA_CUSTOMER_ADAPTER_VERSION,
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
  DATA_CUSTOMER_MATCHER_VERSION,
  stagedMatchEmail,
} from "@/features/data-intake/domain/matching";
import {
  buildImportPlanSnapshot,
  persistedMatchesCurrent,
} from "@/features/data-intake/domain/planning";
import {
  dataFail,
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import type {
  DataIntakeExecutionSuccess,
  ExecuteDataIntakeSourceInput,
} from "@/features/data-intake/domain/types";
import { invokeDataIntakeExecutionMutation } from "@/features/data-intake/server/data-intake-execution-rpc";
import type { DataIntakeExecutionRpcClient } from "@/features/data-intake/server/data-intake-execution-rpc";
import type {
  DataIntakePlanRecord,
  DataIntakeRecordLookup,
  DataIntakeRowResultRecord,
} from "@/features/data-intake/server/data-intake-lookup";
import type { DataIntakeQueryClient } from "@/features/data-intake/server/data-intake-query";
import type { DataIntakeObjectStore } from "@/features/data-intake/server/source-object-store";
import type { CustomerIdentityLookup } from "@/features/data-intake/server/customer-identity-lookup";
import {
  authorizeDataIntakeCaller,
  type DataIntakeAuthLookup,
} from "@/features/data-intake/server/tenant-authorization";
import type { DataIntakeStagingRow } from "@/features/data-intake/domain/staging";
import type { DataImportPlanSnapshot } from "@/features/data-intake/domain/planning";

export type DataIntakeExecutionCommandDeps = {
  auth: DataIntakeAuthLookup;
  queryClient: DataIntakeQueryClient;
  lookup: DataIntakeRecordLookup;
  objectStore: DataIntakeObjectStore;
  customers: CustomerIdentityLookup;
  executionMutate: DataIntakeExecutionRpcClient;
};

const EXECUTABLE_SESSION_STATUSES = new Set([
  "approved",
  "importing",
  "failed",
  "completed",
  "completed_with_errors",
]);

const EXECUTABLE_PLAN_STATUSES = new Set(["approved", "executing", "executed"]);

function asUnknownRecord(input: object): Record<string, unknown> {
  return input as Record<string, unknown>;
}

function clientAttemptedExecutionAuthority(input: Record<string, unknown>): boolean {
  return (
    "targetRecordId" in input ||
    "target_record_id" in input ||
    "targetOperation" in input ||
    "target_operation" in input ||
    "resolution" in input ||
    "customers" in input ||
    "operations" in input ||
    "includedFingerprints" in input ||
    "display_name" in input ||
    "email" in input ||
    "phone" in input ||
    "first_name" in input ||
    "last_name" in input ||
    "rows" in input ||
    "records" in input ||
    "normalized_values" in input ||
    "raw_values" in input
  );
}

function currentExecutablePlan(plans: readonly DataIntakePlanRecord[]): DataIntakePlanRecord | null {
  return (
    plans.find((plan) => plan.status === "executing") ??
    plans.find((plan) => plan.status === "approved") ??
    plans.find((plan) => plan.status === "executed") ??
    null
  );
}

async function evaluateExecutionContext(
  deps: DataIntakeExecutionCommandDeps,
  input: ExecuteDataIntakeSourceInput,
): Promise<
  DataIntakeResult<{
    organizationId: string;
    userId: string;
    membershipId: string;
    sessionId: string;
    sessionStatus: DataIntakeExecutionSuccess["status"];
    targetDomain: string;
    sourceKind: DataIntakeExecutionSuccess["sourceKind"];
    sourceId: string;
    storagePath: string;
    storageBucket: string;
    snapshot: DataImportPlanSnapshot;
    rows: DataIntakeStagingRow[];
    activePlan: DataIntakePlanRecord;
    results: DataIntakeRowResultRecord[];
  }>
> {
  if (clientAttemptedStorageAuthority(asUnknownRecord(input))) {
    return dataFail("SOURCE_INVALID", "Client storage path is not accepted");
  }
  if (clientAttemptedExecutionAuthority(asUnknownRecord(input))) {
    return dataFail("SOURCE_INVALID", "Client execution targets and Customer fields are not accepted");
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
  if (input.planHash && !DATA_SHA256_PATTERN.test(input.planHash)) {
    return dataFail("PLAN_STALE", "planHash must be the current immutable plan digest");
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
    return dataFail("TARGET_NOT_SUPPORTED", "DATA-1J execution supports customer only");
  }
  if (session.value.status === "cancelled") {
    return dataFail("INVALID_STATE", "Cancelled sessions cannot be executed");
  }
  if (!EXECUTABLE_SESSION_STATUSES.has(session.value.status)) {
    return dataFail("INVALID_STATE", "Import execution requires an approved plan");
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
    return dataFail("SOURCE_NOT_VERIFIED", "Source object must be verified before execution");
  }
  if (source.supersededAt || source.deletedAt) {
    return dataFail("INVALID_STATE", "Superseded or deleted sources cannot be executed");
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
    return dataFail("INVALID_STATE", "Persisted source structure is not usable for execution");
  }
  const confirmed = decisions.value.filter(
    (row) => row.status === "confirmed" || row.status === "rejected",
  );
  if (confirmed.filter((row) => row.status === "confirmed").length === 0) {
    return dataFail("MAPPING_INCOMPLETE", "Execution requires a confirmed mapping");
  }
  const mappingSnapshot = canonicalizeMappingSnapshot({
    columns: sourceColumnsFromDiscovery(persisted),
    decisions: confirmed,
  });
  const mappingHash = mappingSnapshotHash(mappingSnapshot);
  if (input.mappingHash && input.mappingHash !== mappingHash) {
    return dataFail("MAPPING_HASH_MISMATCH", "Execution is bound to the current confirmed mapping hash");
  }

  const staged = await deps.lookup.findStaging({
    organizationId: authorized.value.organizationId,
    sourceId: source.id,
  });
  if (!staged.ok) {
    return staged;
  }
  if (staged.value.length === 0) {
    return dataFail("INVALID_STATE", "Execution requires completed staging rows");
  }

  const matchingEvent = await deps.lookup.findLatestEvent({
    organizationId: authorized.value.organizationId,
    sessionId: input.sessionId,
    eventType: "matching_completed",
  });
  if (!matchingEvent.ok) {
    return matchingEvent;
  }
  if (!matchingEvent.value) {
    return dataFail("INVALID_STATE", "Import execution requires current matching completion");
  }
  const matchMeta = matchingEvent.value.metadata;
  if (
    matchMeta.source_id !== source.id ||
    matchMeta.mapping_hash !== mappingHash ||
    matchMeta.matcher_version !== DATA_CUSTOMER_MATCHER_VERSION
  ) {
    return dataFail("PLAN_STALE", "Matching completion is not current for this source and mapping");
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
  const snapshot = buildImportPlanSnapshot({
    sourceId: source.id,
    sourceSha256: digest,
    mappingSnapshot,
    mappingHash,
    rows: staged.value,
  });
  if (input.planHash && input.planHash !== snapshot.planHash) {
    return dataFail("PLAN_STALE", "Submitted plan hash is not the current immutable snapshot");
  }

  const plans = await deps.lookup.findPlans({
    organizationId: authorized.value.organizationId,
    sessionId: input.sessionId,
  });
  if (!plans.ok) {
    return plans;
  }
  const activePlan = currentExecutablePlan(plans.value);
  if (!activePlan) {
    return dataFail("INVALID_STATE", "Import execution requires an approved plan");
  }
  if (!EXECUTABLE_PLAN_STATUSES.has(activePlan.status)) {
    return dataFail("INVALID_STATE", "Only an approved plan can be executed");
  }
  if (activePlan.status === "draft" || activePlan.status === "superseded") {
    return dataFail("INVALID_STATE", "Only an approved plan can be executed");
  }
  if (activePlan.planHash !== snapshot.planHash) {
    return dataFail("PLAN_STALE", "Execution is bound to the exact current plan snapshot");
  }
  if (activePlan.sourceSha256 !== snapshot.sourceSha256) {
    return dataFail("PLAN_STALE", "Approved plan source hash is no longer current");
  }
  if (!activePlan.approvedByUserId || !activePlan.approvedAt) {
    return dataFail("INVALID_STATE", "Execution requires a human-approved plan");
  }
  if (session.value.currentPlanId && session.value.currentPlanId !== activePlan.id) {
    return dataFail("PLAN_STALE", "Session current plan is not the executable plan");
  }

  const results = await deps.lookup.findRowResults({
    organizationId: authorized.value.organizationId,
    planId: activePlan.id,
  });
  if (!results.ok) {
    return results;
  }
  const finishedFingerprints = new Set(
    results.value
      .filter((row) => row.outcome === "imported" || row.outcome === "skipped")
      .map((row) => row.rowFingerprint),
  );
  const unfinishedRows = staged.value.filter(
    (row) => !finishedFingerprints.has(row.rowFingerprint),
  );
  const matches = classifyIdentityResolutions({
    organizationId: authorized.value.organizationId,
    rows: unfinishedRows,
    candidates: candidates.value,
  });
  if (!persistedMatchesCurrent({ rows: unfinishedRows, matches })) {
    return dataFail("PLAN_STALE", "Staging resolution is not the current matching result");
  }

  for (const operation of snapshot.operations) {
    const stagedRow = staged.value.find((row) => row.rowFingerprint === operation.rowFingerprint);
    if (!stagedRow || stagedRow.lifecycle !== "validated") {
      return dataFail("PLAN_STALE", "Executable plan row is no longer valid");
    }
    if (
      operation.targetOperation === "link" &&
      operation.targetRecordId &&
      !finishedFingerprints.has(operation.rowFingerprint)
    ) {
      const stagedEmail = stagedMatchEmail(stagedRow);
      const target = candidates.value.find((item) => item.id === operation.targetRecordId);
      if (
        !target ||
        target.organizationId !== authorized.value.organizationId ||
        !stagedEmail ||
        target.email !== stagedEmail
      ) {
        return dataFail("PLAN_STALE", "Link target Customer is no longer valid for this plan");
      }
    }
    if (
      operation.targetOperation === "create" &&
      !finishedFingerprints.has(operation.rowFingerprint)
    ) {
      const stagedEmail = stagedMatchEmail(stagedRow);
      if (
        stagedEmail &&
        candidates.value.some(
          (item) =>
            item.email === stagedEmail && item.organizationId === authorized.value.organizationId,
        )
      ) {
        return dataFail("PLAN_STALE", "Create target Customer already exists for this plan");
      }
    }
    if (
      operation.targetOperation !== "create" &&
      operation.targetOperation !== "link" &&
      operation.targetOperation !== "skip"
    ) {
      return dataFail("PLAN_STALE", "Blocked or conflict rows cannot be executed");
    }
  }

  return dataOk({
    organizationId: authorized.value.organizationId,
    userId: authorized.value.userId,
    membershipId: authorized.value.membershipId,
    sessionId: session.value.id,
    sessionStatus: session.value.status,
    targetDomain: session.value.targetDomain,
    sourceKind: source.sourceKind,
    sourceId: source.id,
    storagePath: source.storagePath,
    storageBucket: source.storageBucket,
    snapshot,
    rows: staged.value,
    activePlan,
    results: results.value,
  });
}

function successFromMutation(
  mutated: Extract<
    Awaited<ReturnType<typeof invokeDataIntakeExecutionMutation>>,
    { ok: true }
  >["value"],
  context: {
    sourceKind: DataIntakeExecutionSuccess["sourceKind"];
    sourceId: string;
    storagePath: string;
    storageBucket: string;
    snapshot: DataImportPlanSnapshot;
    activePlan: DataIntakePlanRecord;
  },
): DataIntakeExecutionSuccess {
  return {
    sessionId: mutated.sessionId,
    status: mutated.status,
    targetDomain: mutated.targetDomain,
    sourceKind: mutated.sourceKind ?? context.sourceKind,
    sourceId: mutated.sourceId ?? context.sourceId,
    storagePath: mutated.storagePath ?? context.storagePath,
    storageBucket: mutated.storageBucket ?? context.storageBucket,
    eventId: mutated.eventId,
    eventType: mutated.eventType,
    replayed: mutated.replayed,
    mappingHash: mutated.mappingHash ?? context.snapshot.mappingHash,
    sourceSha256: context.snapshot.sourceSha256,
    planId: mutated.planId ?? context.activePlan.id,
    planHash: mutated.planHash ?? context.snapshot.planHash,
    planStatus: mutated.planStatus ?? context.activePlan.status,
    version: mutated.version ?? context.activePlan.version,
    approvedAt: mutated.approvedAt ?? context.activePlan.approvedAt,
    approvedByUserId: mutated.approvedByUserId ?? context.activePlan.approvedByUserId,
    batchIndex: mutated.batchIndex,
    lastCompletedBatchIndex: mutated.lastCompletedBatchIndex,
    done: mutated.done,
    summary: mutated.summary,
    results: mutated.results,
  };
}

export async function executeDataIntakeImportPlanBatch(
  deps: DataIntakeExecutionCommandDeps,
  input: ExecuteDataIntakeSourceInput,
): Promise<DataIntakeResult<DataIntakeExecutionSuccess>> {
  const context = await evaluateExecutionContext(deps, input);
  if (!context.ok) {
    return context;
  }
  const mutated = await invokeDataIntakeExecutionMutation(deps.executionMutate, {
    p_operation: "execute_import_plan",
    p_organization_id: context.value.organizationId,
    p_actor_user_id: context.value.userId,
    p_actor_member_id: context.value.membershipId,
    p_payload: {
      session_id: context.value.sessionId,
      source_id: context.value.sourceId,
      plan_id: context.value.activePlan.id,
      plan_hash: context.value.snapshot.planHash,
      mapping_hash: context.value.snapshot.mappingHash,
      source_sha256: context.value.snapshot.sourceSha256,
      matcher_version: DATA_CUSTOMER_MATCHER_VERSION,
      adapter_version: DATA_CUSTOMER_ADAPTER_VERSION,
    },
  });
  if (!mutated.ok) {
    return mutated;
  }
  return dataOk(successFromMutation(mutated.value, context.value));
}

export async function executeDataIntakeImportPlan(
  deps: DataIntakeExecutionCommandDeps,
  input: ExecuteDataIntakeSourceInput,
): Promise<DataIntakeResult<DataIntakeExecutionSuccess>> {
  let last: DataIntakeResult<DataIntakeExecutionSuccess> | null = null;
  for (let attempt = 0; attempt < 200; attempt += 1) {
    last = await executeDataIntakeImportPlanBatch(deps, input);
    if (!last.ok || last.value.done || last.value.replayed) {
      return last;
    }
  }
  return last ?? dataFail("DATABASE_WRITE_ERROR", "Import execution did not finalize");
}
