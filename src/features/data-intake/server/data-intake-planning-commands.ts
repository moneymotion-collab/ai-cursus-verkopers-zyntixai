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
  planningBlockers,
  planSummaryForPersistence,
  snapshotFromPersistedPlan,
} from "@/features/data-intake/domain/planning";
import {
  dataFail,
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import type {
  DataIntakePlanningSuccess,
  PlanDataIntakeSourceInput,
} from "@/features/data-intake/domain/types";
import { invokeDataIntakePlanningMutation } from "@/features/data-intake/server/data-intake-planning-rpc";
import type { DataIntakePlanningRpcClient } from "@/features/data-intake/server/data-intake-planning-rpc";
import type {
  DataIntakePlanRecord,
  DataIntakeRecordLookup,
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

export type DataIntakePlanningCommandDeps = {
  auth: DataIntakeAuthLookup;
  queryClient: DataIntakeQueryClient;
  lookup: DataIntakeRecordLookup;
  objectStore: DataIntakeObjectStore;
  customers: CustomerIdentityLookup;
  planningMutate: DataIntakePlanningRpcClient;
};

function asUnknownRecord(input: object): Record<string, unknown> {
  return input as Record<string, unknown>;
}

function clientAttemptedPlanAuthority(input: Record<string, unknown>): boolean {
  return (
    "targetRecordId" in input ||
    "target_record_id" in input ||
    "targetOperation" in input ||
    "target_operation" in input ||
    "resolution" in input ||
    "customers" in input ||
    "operations" in input ||
    "includedFingerprints" in input
  );
}

function currentPlan(plans: readonly DataIntakePlanRecord[]): DataIntakePlanRecord | null {
  const approved = plans.find((plan) => plan.status === "approved" || plan.status === "executing");
  if (approved) {
    return approved;
  }
  const drafts = plans
    .filter((plan) => plan.status === "draft")
    .sort((a, b) => b.version - a.version);
  return drafts[0] ?? null;
}

function successFromPlan(input: {
  sessionId: string;
  status: DataIntakePlanningSuccess["status"];
  targetDomain: string;
  sourceKind: DataIntakePlanningSuccess["sourceKind"];
  sourceId: string;
  storagePath: string;
  storageBucket: string;
  eventId: string | null;
  eventType: string | null;
  replayed?: boolean;
  snapshot: DataImportPlanSnapshot;
  plan: {
    id: string | null;
    status: DataIntakePlanningSuccess["planStatus"];
    version: number | null;
    approvedAt: string | null;
    approvedByUserId: string | null;
  };
}): DataIntakePlanningSuccess {
  return {
    sessionId: input.sessionId,
    status: input.status,
    targetDomain: input.targetDomain,
    sourceKind: input.sourceKind,
    sourceId: input.sourceId,
    storagePath: input.storagePath,
    storageBucket: input.storageBucket,
    eventId: input.eventId,
    eventType: input.eventType,
    replayed: input.replayed,
    mappingHash: input.snapshot.mappingHash,
    sourceSha256: input.snapshot.sourceSha256,
    planId: input.plan.id,
    planHash: input.snapshot.planHash,
    planStatus: input.plan.status,
    version: input.plan.version,
    approvedAt: input.plan.approvedAt,
    approvedByUserId: input.plan.approvedByUserId,
    summary: input.snapshot.summary,
    snapshot: input.snapshot,
  };
}

async function evaluatePlanningContext(
  deps: DataIntakePlanningCommandDeps,
  input: PlanDataIntakeSourceInput,
  mode: "create" | "approve" | "list",
): Promise<
  DataIntakeResult<{
    organizationId: string;
    userId: string;
    membershipId: string;
    sessionId: string;
    sessionStatus: DataIntakePlanningSuccess["status"];
    targetDomain: string;
    sourceKind: DataIntakePlanningSuccess["sourceKind"];
    sourceId: string;
    storagePath: string;
    storageBucket: string;
    snapshot: DataImportPlanSnapshot;
    rows: DataIntakeStagingRow[];
    plans: DataIntakePlanRecord[];
    activePlan: DataIntakePlanRecord | null;
  }>
> {
  if (clientAttemptedStorageAuthority(asUnknownRecord(input))) {
    return dataFail("SOURCE_INVALID", "Client storage path is not accepted");
  }
  if (clientAttemptedPlanAuthority(asUnknownRecord(input))) {
    return dataFail("SOURCE_INVALID", "Client plan targets are not accepted");
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
    return dataFail("TARGET_NOT_SUPPORTED", "DATA-1I planning supports customer only");
  }
  if (session.value.status === "cancelled") {
    return dataFail("INVALID_STATE", "Cancelled sessions cannot accept import planning");
  }
  if (mode === "create" && session.value.status === "review_required") {
    return dataFail(
      "INVALID_STATE",
      "Import-plan creation is denied until review blockers are resolved",
    );
  }
  if (mode === "approve" && session.value.status === "review_required") {
    return dataFail("INVALID_STATE", "A review_required session cannot be approved");
  }
  if (mode === "create" && session.value.status !== "ready_for_approval" && session.value.status !== "approved") {
    return dataFail("INVALID_STATE", "Import planning requires ready_for_approval and current matching");
  }
  if (mode === "approve" && session.value.status !== "ready_for_approval" && session.value.status !== "approved") {
    return dataFail("INVALID_STATE", "Approval requires a current ready_for_approval plan");
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
    return dataFail("SOURCE_NOT_VERIFIED", "Source object must be verified before planning");
  }
  if (source.supersededAt || source.deletedAt) {
    return dataFail("INVALID_STATE", "Superseded or deleted sources cannot be planned");
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
    return dataFail("INVALID_STATE", "Persisted source structure is not usable for planning");
  }
  const confirmed = decisions.value.filter(
    (row) => row.status === "confirmed" || row.status === "rejected",
  );
  if (confirmed.filter((row) => row.status === "confirmed").length === 0) {
    return dataFail("MAPPING_INCOMPLETE", "Planning requires a confirmed mapping");
  }
  const mappingSnapshot = canonicalizeMappingSnapshot({
    columns: sourceColumnsFromDiscovery(persisted),
    decisions: confirmed,
  });
  const mappingHash = mappingSnapshotHash(mappingSnapshot);
  if (input.mappingHash && input.mappingHash !== mappingHash) {
    return dataFail("MAPPING_HASH_MISMATCH", "Planning is bound to the current confirmed mapping hash");
  }

  const staged = await deps.lookup.findStaging({
    organizationId: authorized.value.organizationId,
    sourceId: source.id,
  });
  if (!staged.ok) {
    return staged;
  }
  if (staged.value.length === 0) {
    return dataFail("INVALID_STATE", "Planning requires completed staging rows");
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
    return dataFail(
      "INVALID_STATE",
      "Import planning requires current matching completion",
    );
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
  const matches = classifyIdentityResolutions({
    organizationId: authorized.value.organizationId,
    rows: staged.value,
    candidates: candidates.value,
  });
  if (!persistedMatchesCurrent({ rows: staged.value, matches })) {
    return dataFail("PLAN_STALE", "Staging resolution is not the current matching result");
  }

  const blockers = planningBlockers(staged.value);
  if ((mode === "create" || mode === "approve") && blockers.approvalBlocked) {
    return dataFail(
      "INVALID_STATE",
      "Import planning is denied while blocked, conflict, or no-key rows remain",
    );
  }

  for (const row of staged.value) {
    if (row.resolution !== "duplicate" || row.targetOperation !== "link" || !row.targetRecordId) {
      continue;
    }
    const stagedEmail = stagedMatchEmail(row);
    const target = candidates.value.find((item) => item.id === row.targetRecordId);
    if (
      !target ||
      target.organizationId !== authorized.value.organizationId ||
      !stagedEmail ||
      target.email !== stagedEmail
    ) {
      return dataFail("PLAN_STALE", "Link target Customer is no longer valid for this plan");
    }
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
    plans: plans.value,
    activePlan: currentPlan(plans.value),
  });
}

export async function createOrReplayDataIntakeImportPlan(
  deps: DataIntakePlanningCommandDeps,
  input: PlanDataIntakeSourceInput,
): Promise<DataIntakeResult<DataIntakePlanningSuccess>> {
  const context = await evaluatePlanningContext(deps, input, "create");
  if (!context.ok) {
    return context;
  }
  const mutated = await invokeDataIntakePlanningMutation(deps.planningMutate, {
    p_operation: "create_import_plan",
    p_organization_id: context.value.organizationId,
    p_actor_user_id: context.value.userId,
    p_actor_member_id: context.value.membershipId,
    p_payload: {
      session_id: context.value.sessionId,
      source_id: context.value.sourceId,
      mapping_hash: context.value.snapshot.mappingHash,
      source_sha256: context.value.snapshot.sourceSha256,
      matcher_version: DATA_CUSTOMER_MATCHER_VERSION,
      adapter_version: DATA_CUSTOMER_ADAPTER_VERSION,
      plan_hash: context.value.snapshot.planHash,
      mapping_snapshot: context.value.snapshot.mappingSnapshot,
      included_fingerprints: context.value.snapshot.includedFingerprints,
      summary: planSummaryForPersistence(context.value.snapshot),
    },
  });
  if (!mutated.ok) {
    return mutated;
  }
  return dataOk({
    sessionId: mutated.value.sessionId,
    status: mutated.value.status,
    targetDomain: mutated.value.targetDomain,
    sourceKind: mutated.value.sourceKind ?? context.value.sourceKind,
    sourceId: mutated.value.sourceId ?? context.value.sourceId,
    storagePath: mutated.value.storagePath ?? context.value.storagePath,
    storageBucket: mutated.value.storageBucket ?? context.value.storageBucket,
    eventId: mutated.value.eventId,
    eventType: mutated.value.eventType,
    replayed: mutated.value.replayed,
    mappingHash: context.value.snapshot.mappingHash,
    sourceSha256: context.value.snapshot.sourceSha256,
    planId: mutated.value.planId,
    planHash: mutated.value.planHash ?? context.value.snapshot.planHash,
    planStatus: mutated.value.planStatus,
    version: mutated.value.version,
    approvedAt: mutated.value.approvedAt,
    approvedByUserId: mutated.value.approvedByUserId,
    summary: mutated.value.summary ?? context.value.snapshot.summary,
    snapshot: context.value.snapshot,
  });
}

export async function approveDataIntakeImportPlan(
  deps: DataIntakePlanningCommandDeps,
  input: PlanDataIntakeSourceInput,
): Promise<DataIntakeResult<DataIntakePlanningSuccess>> {
  const context = await evaluatePlanningContext(deps, input, "approve");
  if (!context.ok) {
    return context;
  }
  if (!context.value.activePlan) {
    return dataFail("INVALID_STATE", "Approval requires a current import plan");
  }
  if (context.value.activePlan.planHash !== context.value.snapshot.planHash) {
    return dataFail("PLAN_STALE", "Approval is bound to the exact current plan snapshot");
  }
  if (context.value.activePlan.sourceSha256 !== context.value.snapshot.sourceSha256) {
    return dataFail("PLAN_STALE", "Approved plan source hash is no longer current");
  }
  const mutated = await invokeDataIntakePlanningMutation(deps.planningMutate, {
    p_operation: "approve_import_plan",
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
    },
  });
  if (!mutated.ok) {
    return mutated;
  }
  return dataOk({
    sessionId: mutated.value.sessionId,
    status: mutated.value.status,
    targetDomain: mutated.value.targetDomain,
    sourceKind: mutated.value.sourceKind ?? context.value.sourceKind,
    sourceId: mutated.value.sourceId ?? context.value.sourceId,
    storagePath: mutated.value.storagePath ?? context.value.storagePath,
    storageBucket: mutated.value.storageBucket ?? context.value.storageBucket,
    eventId: mutated.value.eventId,
    eventType: mutated.value.eventType,
    replayed: mutated.value.replayed,
    mappingHash: context.value.snapshot.mappingHash,
    sourceSha256: context.value.snapshot.sourceSha256,
    planId: mutated.value.planId ?? context.value.activePlan.id,
    planHash: mutated.value.planHash ?? context.value.snapshot.planHash,
    planStatus: mutated.value.planStatus ?? "approved",
    version: mutated.value.version ?? context.value.activePlan.version,
    approvedAt: mutated.value.approvedAt,
    approvedByUserId: mutated.value.approvedByUserId,
    summary: mutated.value.summary ?? context.value.snapshot.summary,
    snapshot: context.value.snapshot,
  });
}

export async function listDataIntakePlanningState(
  deps: DataIntakePlanningCommandDeps,
  input: PlanDataIntakeSourceInput,
): Promise<DataIntakeResult<DataIntakePlanningSuccess>> {
  const context = await evaluatePlanningContext(deps, input, "list");
  if (!context.ok) {
    return context;
  }
  const plan = context.value.activePlan;
  const persisted = plan
    ? snapshotFromPersistedPlan({
        sourceId: plan.sourceId,
        sourceSha256: plan.sourceSha256,
        mappingSnapshot: plan.mappingSnapshot,
        mappingHash:
          typeof plan.summary.mapping_hash === "string"
            ? plan.summary.mapping_hash
            : context.value.snapshot.mappingHash,
        includedFingerprints: plan.includedFingerprints,
        summary: plan.summary,
        planHash: plan.planHash,
      })
    : context.value.snapshot;
  return dataOk(
    successFromPlan({
      sessionId: context.value.sessionId,
      status: context.value.sessionStatus,
      targetDomain: context.value.targetDomain,
      sourceKind: context.value.sourceKind,
      sourceId: context.value.sourceId,
      storagePath: context.value.storagePath,
      storageBucket: context.value.storageBucket,
      eventId: null,
      eventType: null,
      snapshot: persisted ?? context.value.snapshot,
      plan: plan
        ? {
            id: plan.id,
            status: plan.status,
            version: plan.version,
            approvedAt: plan.approvedAt,
            approvedByUserId: plan.approvedByUserId,
          }
        : {
            id: null,
            status: null,
            version: null,
            approvedAt: null,
            approvedByUserId: null,
          },
    }),
  );
}
