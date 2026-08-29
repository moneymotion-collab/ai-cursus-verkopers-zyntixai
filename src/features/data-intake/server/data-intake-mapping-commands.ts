import "server-only";

import { canPerformDataIntakeFoundationCommand } from "@/features/data-intake/domain/authorization";
import { DATA_EXECUTABLE_TARGET_DOMAIN, isDataUuid } from "@/features/data-intake/domain/constants";
import { discoveryFromPersisted } from "@/features/data-intake/domain/parse-metadata";
import {
  canonicalizeMappingSnapshot,
  duplicateTargetField,
  evaluateMappingCompleteness,
  mappingSnapshotHash,
  validateMappingTarget,
  type DataIntakeMappingRow,
} from "@/features/data-intake/domain/mapping";
import { findSourceColumn, sourceColumnsFromDiscovery } from "@/features/data-intake/domain/source-column";
import { getCustomerImportTargetCatalog } from "@/features/data-intake/domain/target-catalog";
import {
  dataFail,
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import type {
  ConfirmDataIntakeMappingInput,
  DataIntakeMappingCommandInput,
  DataIntakeMappingSuccess,
} from "@/features/data-intake/domain/types";
import { invokeDataIntakeMappingMutation } from "@/features/data-intake/server/data-intake-mapping-rpc";
import type { DataIntakeMappingRpcClient } from "@/features/data-intake/server/data-intake-mapping-rpc";
import type { DataIntakeRecordLookup } from "@/features/data-intake/server/data-intake-lookup";
import type { DataIntakeQueryClient } from "@/features/data-intake/server/data-intake-query";
import {
  authorizeDataIntakeCaller,
  type DataIntakeAuthLookup,
} from "@/features/data-intake/server/tenant-authorization";

export type DataIntakeMappingCommandDeps = {
  auth: DataIntakeAuthLookup;
  queryClient: DataIntakeQueryClient;
  lookup: DataIntakeRecordLookup;
  mappingMutate: DataIntakeMappingRpcClient;
};

const EDITABLE_STATUSES = new Set(["parsed", "mapping_required", "mapped"]);

async function authorizeMapping(
  deps: DataIntakeMappingCommandDeps,
  organizationId: string,
) {
  const authorized = await authorizeDataIntakeCaller({
    auth: deps.auth,
    queryClient: deps.queryClient,
    organizationId,
  });
  if (!authorized.ok) {
    return authorized;
  }
  if (!canPerformDataIntakeFoundationCommand(authorized.value.role)) {
    return dataFail("FORBIDDEN_ROLE", "Owner or Admin role is required");
  }
  return authorized;
}

async function loadMappingContext(
  deps: DataIntakeMappingCommandDeps,
  input: {
    organizationId: string;
    sessionId: string;
    sourceId?: string;
  },
) {
  if (!isDataUuid(input.sessionId)) {
    return dataFail("SESSION_NOT_FOUND", "sessionId is required");
  }
  if (input.sourceId && !isDataUuid(input.sourceId)) {
    return dataFail("SOURCE_NOT_FOUND", "sourceId is required");
  }
  const session = await deps.lookup.findSession({
    organizationId: input.organizationId,
    sessionId: input.sessionId,
  });
  if (!session.ok) {
    return session;
  }
  if (!session.value) {
    return dataFail("SESSION_NOT_FOUND", "Intake session not found");
  }
  if (session.value.targetDomain !== DATA_EXECUTABLE_TARGET_DOMAIN) {
    return dataFail("TARGET_NOT_SUPPORTED", "DATA-1F mapping supports customer only");
  }
  if (session.value.status === "cancelled") {
    return dataFail("INVALID_STATE", "Cancelled sessions cannot accept mapping");
  }
  if (!EDITABLE_STATUSES.has(session.value.status)) {
    return dataFail("INVALID_STATE", "Mapping requires a parsed or mapping session");
  }
  const sourceResult = input.sourceId
    ? await deps.lookup.findSource({
        organizationId: input.organizationId,
        sourceId: input.sourceId,
      })
    : await deps.lookup.findActiveSource({
        organizationId: input.organizationId,
        sessionId: input.sessionId,
      });
  if (!sourceResult.ok) {
    return sourceResult;
  }
  const source = sourceResult.value;
  if (!source || source.sessionId !== input.sessionId) {
    return dataFail("SOURCE_NOT_FOUND", "Intake source not found for this session");
  }
  if (source.headerRowIndex === null) {
    return dataFail("INVALID_STATE", "Mapping requires completed structure discovery");
  }
  const discovery = discoveryFromPersisted({
    sourceKind: source.sourceKind,
    encoding: source.encoding,
    delimiter: source.delimiter,
    sheetName: source.sheetName,
    headerRowIndex: source.headerRowIndex,
    rowCount: source.rowCount,
    columnCount: source.columnCount,
    parseMetadata: source.parseMetadata,
  });
  if (!discovery) {
    return dataFail("INVALID_STATE", "Persisted source structure is not usable for mapping");
  }
  const decisions = await deps.lookup.findMappings({
    organizationId: input.organizationId,
    sourceId: source.id,
  });
  if (!decisions.ok) {
    return decisions;
  }
  return dataOk({
    session: session.value,
    source,
    discovery,
    columns: sourceColumnsFromDiscovery(discovery),
    decisions: decisions.value,
  });
}

function toSuccess(
  base: {
    sessionId: string;
    status: DataIntakeMappingSuccess["status"];
    targetDomain: string;
    sourceKind: DataIntakeMappingSuccess["sourceKind"];
    sourceId: string | null;
    storagePath: string | null;
    storageBucket: string | null;
    eventId: string | null;
    eventType: string | null;
    replayed?: boolean;
  },
  decisions: DataIntakeMappingRow[],
  columns: ReturnType<typeof sourceColumnsFromDiscovery>,
  includeSnapshot: boolean,
): DataIntakeMappingSuccess {
  const completeness = evaluateMappingCompleteness({ columns, decisions });
  const snapshot = canonicalizeMappingSnapshot({ columns, decisions });
  return {
    ...base,
    decisions,
    completeness,
    ...(includeSnapshot
      ? { snapshot, snapshotHash: mappingSnapshotHash(snapshot) }
      : {}),
  };
}

export function listCustomerImportTargetCatalog() {
  return getCustomerImportTargetCatalog();
}

export async function listDataIntakeMappingState(
  deps: DataIntakeMappingCommandDeps,
  input: ConfirmDataIntakeMappingInput,
): Promise<DataIntakeResult<DataIntakeMappingSuccess>> {
  const authorized = await authorizeMapping(deps, input.organizationId);
  if (!authorized.ok) {
    return authorized;
  }
  const context = await loadMappingContext(deps, {
    organizationId: authorized.value.organizationId,
    sessionId: input.sessionId,
    sourceId: input.sourceId,
  });
  if (!context.ok) {
    return context;
  }
  return dataOk(
    toSuccess(
      {
        sessionId: context.value.session.id,
        status: context.value.session.status,
        targetDomain: context.value.session.targetDomain,
        sourceKind: context.value.session.sourceKind,
        sourceId: context.value.source.id,
        storagePath: context.value.source.storagePath,
        storageBucket: context.value.source.storageBucket,
        eventId: null,
        eventType: null,
      },
      context.value.decisions,
      context.value.columns,
      context.value.session.status === "mapped",
    ),
  );
}

export async function upsertDataIntakeMapping(
  deps: DataIntakeMappingCommandDeps,
  input: DataIntakeMappingCommandInput,
): Promise<DataIntakeResult<DataIntakeMappingSuccess>> {
  const authorized = await authorizeMapping(deps, input.organizationId);
  if (!authorized.ok) {
    return authorized;
  }
  const targetField = input.targetField?.trim() ?? "";
  if (!targetField) {
    return dataFail("TARGET_FIELD_UNKNOWN", "targetField is required");
  }
  const targetCheck = validateMappingTarget({
    targetDomain: DATA_EXECUTABLE_TARGET_DOMAIN,
    targetField,
  });
  if (targetCheck !== "ok") {
    return dataFail(targetCheck, "Target field is not an approved customer import field");
  }
  const context = await loadMappingContext(deps, {
    organizationId: authorized.value.organizationId,
    sessionId: input.sessionId,
    sourceId: input.sourceId,
  });
  if (!context.ok) {
    return context;
  }
  const column = findSourceColumn(context.value.discovery, input.sourceFieldKey);
  if (!column) {
    return dataFail("SOURCE_COLUMN_UNKNOWN", "Source column is not in the frozen discovery");
  }
  if (duplicateTargetField(context.value.decisions, column.key, targetField)) {
    return dataFail("DUPLICATE_TARGET_MAPPING", "Each customer field may be mapped from at most one source column");
  }
  const mutated = await invokeDataIntakeMappingMutation(deps.mappingMutate, {
    p_operation: "upsert_mapping",
    p_organization_id: authorized.value.organizationId,
    p_actor_user_id: authorized.value.userId,
    p_actor_member_id: authorized.value.membershipId,
    p_payload: {
      session_id: input.sessionId,
      source_id: context.value.source.id,
      source_field_key: column.key,
      source_header: column.header,
      target_field: targetField,
    },
  });
  if (!mutated.ok) {
    return mutated;
  }
  const decisions = await deps.lookup.findMappings({
    organizationId: authorized.value.organizationId,
    sourceId: context.value.source.id,
  });
  if (!decisions.ok) {
    return decisions;
  }
  return dataOk(toSuccess(mutated.value, decisions.value, context.value.columns, false));
}

export async function ignoreDataIntakeSourceColumn(
  deps: DataIntakeMappingCommandDeps,
  input: DataIntakeMappingCommandInput,
): Promise<DataIntakeResult<DataIntakeMappingSuccess>> {
  const authorized = await authorizeMapping(deps, input.organizationId);
  if (!authorized.ok) {
    return authorized;
  }
  const context = await loadMappingContext(deps, {
    organizationId: authorized.value.organizationId,
    sessionId: input.sessionId,
    sourceId: input.sourceId,
  });
  if (!context.ok) {
    return context;
  }
  const column = findSourceColumn(context.value.discovery, input.sourceFieldKey);
  if (!column) {
    return dataFail("SOURCE_COLUMN_UNKNOWN", "Source column is not in the frozen discovery");
  }
  const mutated = await invokeDataIntakeMappingMutation(deps.mappingMutate, {
    p_operation: "ignore_source_column",
    p_organization_id: authorized.value.organizationId,
    p_actor_user_id: authorized.value.userId,
    p_actor_member_id: authorized.value.membershipId,
    p_payload: {
      session_id: input.sessionId,
      source_id: context.value.source.id,
      source_field_key: column.key,
      source_header: column.header,
    },
  });
  if (!mutated.ok) {
    return mutated;
  }
  const decisions = await deps.lookup.findMappings({
    organizationId: authorized.value.organizationId,
    sourceId: context.value.source.id,
  });
  if (!decisions.ok) {
    return decisions;
  }
  return dataOk(toSuccess(mutated.value, decisions.value, context.value.columns, false));
}

export async function confirmDataIntakeMapping(
  deps: DataIntakeMappingCommandDeps,
  input: ConfirmDataIntakeMappingInput,
): Promise<DataIntakeResult<DataIntakeMappingSuccess>> {
  const authorized = await authorizeMapping(deps, input.organizationId);
  if (!authorized.ok) {
    return authorized;
  }
  const context = await loadMappingContext(deps, {
    organizationId: authorized.value.organizationId,
    sessionId: input.sessionId,
    sourceId: input.sourceId,
  });
  if (!context.ok) {
    return context;
  }
  const completeness = evaluateMappingCompleteness({
    columns: context.value.columns,
    decisions: context.value.decisions,
  });
  if (!completeness.confirmable) {
    return dataFail("MAPPING_INCOMPLETE", "Required customer import fields are not mapped", {
      missingRequiredTargets: completeness.missingRequiredTargets,
    });
  }
  const snapshot = canonicalizeMappingSnapshot({
    columns: context.value.columns,
    decisions: context.value.decisions,
  });
  const snapshotHash = mappingSnapshotHash(snapshot);
  const mutated = await invokeDataIntakeMappingMutation(deps.mappingMutate, {
    p_operation: "confirm_mapping",
    p_organization_id: authorized.value.organizationId,
    p_actor_user_id: authorized.value.userId,
    p_actor_member_id: authorized.value.membershipId,
    p_payload: {
      session_id: input.sessionId,
      source_id: context.value.source.id,
      mapping_hash: snapshotHash,
    },
  });
  if (!mutated.ok) {
    return mutated;
  }
  const decisions = await deps.lookup.findMappings({
    organizationId: authorized.value.organizationId,
    sourceId: context.value.source.id,
  });
  if (!decisions.ok) {
    return decisions;
  }
  return dataOk(toSuccess(mutated.value, decisions.value, context.value.columns, true));
}
