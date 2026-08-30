import "server-only";

import {
  dataFail,
  dataOk,
  isDataIntakeErrorCode,
  type DataIntakeErrorCode,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import { isDataSourceKind } from "@/features/data-intake/domain/constants";
import type { DataIntakeSessionStatus } from "@/features/data-intake/domain/types";
import type { DataIntakePlanningOperation } from "@/features/data-intake/domain/authorization";
import {
  DATA_IMPORT_PLAN_STATUSES,
  type DataImportPlanStatus,
  type DataImportPlanSummary,
} from "@/features/data-intake/domain/planning";
import { DATA_CUSTOMER_MATCHER_VERSION } from "@/features/data-intake/domain/matching";
import type { Database } from "@/types/database";

export const DATA_INTAKE_PLANNING_RPC =
  "apply_data_intake_planning_mutation" as const satisfies keyof Database["public"]["Functions"];

type DataIntakePlanningFn = Database["public"]["Functions"][typeof DATA_INTAKE_PLANNING_RPC];

export type DataIntakePlanningRpcArgs = Omit<
  DataIntakePlanningFn["Args"],
  "p_operation" | "p_payload"
> & {
  p_operation: DataIntakePlanningOperation;
  p_payload: Record<string, unknown>;
};

export type DataIntakePlanningRpcClient = {
  rpc(
    fn: typeof DATA_INTAKE_PLANNING_RPC,
    args: DataIntakePlanningRpcArgs,
  ): PromiseLike<{
    data: DataIntakePlanningFn["Returns"];
    error: { message: string; code?: string } | null;
  }>;
};

const SESSION_STATUSES = new Set<DataIntakeSessionStatus>([
  "created",
  "source_ready",
  "parsed",
  "mapping_required",
  "mapped",
  "validating",
  "review_required",
  "ready_for_approval",
  "approved",
  "importing",
  "completed",
  "completed_with_errors",
  "failed",
  "cancelled",
]);

const PLAN_STATUSES = new Set<DataImportPlanStatus>(DATA_IMPORT_PLAN_STATUSES);

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function parseErrorCode(value: unknown): DataIntakeErrorCode {
  return typeof value === "string" && isDataIntakeErrorCode(value)
    ? value
    : "DATABASE_WRITE_ERROR";
}

function parseStatus(value: unknown): DataIntakeSessionStatus | null {
  return typeof value === "string" && SESSION_STATUSES.has(value as DataIntakeSessionStatus)
    ? (value as DataIntakeSessionStatus)
    : null;
}

function asSourceKind(value: unknown) {
  return typeof value === "string" && isDataSourceKind(value) ? value : null;
}

export type DataIntakePlanningRpcSuccess = {
  sessionId: string;
  status: DataIntakeSessionStatus;
  targetDomain: string;
  sourceKind: ReturnType<typeof asSourceKind>;
  sourceId: string | null;
  storagePath: string | null;
  storageBucket: string | null;
  eventId: string | null;
  eventType: string | null;
  replayed: boolean;
  planId: string | null;
  planHash: string | null;
  planStatus: DataImportPlanStatus | null;
  version: number | null;
  approvedAt: string | null;
  approvedByUserId: string | null;
  mappingHash: string | null;
  summary: DataImportPlanSummary | null;
};

function parseSummary(value: unknown): DataImportPlanSummary | null {
  const row = asObject(value);
  if (
    !row ||
    typeof row.source_data_rows !== "number" ||
    typeof row.validated_rows !== "number" ||
    typeof row.create_candidates !== "number" ||
    typeof row.link_candidates !== "number" ||
    typeof row.blocked_rows !== "number" ||
    typeof row.conflicts !== "number" ||
    typeof row.no_key_rows !== "number" ||
    typeof row.excluded_rows !== "number" ||
    typeof row.executable_rows !== "number" ||
    typeof row.mapping_hash !== "string"
  ) {
    return null;
  }
  return {
    sourceDataRows: row.source_data_rows,
    validatedRows: row.validated_rows,
    createCandidates: row.create_candidates,
    linkCandidates: row.link_candidates,
    blockedRows: row.blocked_rows,
    conflicts: row.conflicts,
    noKeyRows: row.no_key_rows,
    excludedRows: row.excluded_rows,
    executableRows: row.executable_rows,
    mappingHash: row.mapping_hash,
    matcherVersion: DATA_CUSTOMER_MATCHER_VERSION,
  };
}

export function mapDataIntakePlanningRpcPayload(
  payload: unknown,
): DataIntakeResult<DataIntakePlanningRpcSuccess> {
  const row = asObject(payload);
  if (!row) {
    return dataFail("DATABASE_WRITE_ERROR", "DATA mutation returned an invalid payload");
  }
  if (row.ok === false) {
    return dataFail(
      parseErrorCode(row.code),
      typeof row.message === "string" ? row.message : "DATA mutation failed",
    );
  }
  const status = parseStatus(row.status);
  const sourceKind = asSourceKind(row.source_kind);
  if (
    row.ok !== true ||
    typeof row.session_id !== "string" ||
    typeof row.target_domain !== "string" ||
    !status ||
    !sourceKind
  ) {
    return dataFail("DATABASE_WRITE_ERROR", "DATA mutation returned an incomplete result");
  }
  const planStatus =
    typeof row.plan_status === "string" && PLAN_STATUSES.has(row.plan_status as DataImportPlanStatus)
      ? (row.plan_status as DataImportPlanStatus)
      : null;
  return dataOk({
    sessionId: row.session_id,
    status,
    targetDomain: row.target_domain,
    sourceKind,
    sourceId: typeof row.source_id === "string" ? row.source_id : null,
    storagePath: typeof row.storage_path === "string" ? row.storage_path : null,
    storageBucket: typeof row.storage_bucket === "string" ? row.storage_bucket : null,
    eventId: typeof row.event_id === "string" ? row.event_id : null,
    eventType: typeof row.event_type === "string" ? row.event_type : null,
    replayed: row.replayed === true,
    planId: typeof row.plan_id === "string" ? row.plan_id : null,
    planHash: typeof row.plan_hash === "string" ? row.plan_hash : null,
    planStatus,
    version: typeof row.version === "number" ? row.version : null,
    approvedAt: typeof row.approved_at === "string" ? row.approved_at : null,
    approvedByUserId: typeof row.approved_by_user_id === "string" ? row.approved_by_user_id : null,
    mappingHash: typeof row.mapping_hash === "string" ? row.mapping_hash : null,
    summary: parseSummary(row.summary),
  });
}

export async function invokeDataIntakePlanningMutation(
  client: DataIntakePlanningRpcClient,
  args: DataIntakePlanningRpcArgs,
): Promise<DataIntakeResult<DataIntakePlanningRpcSuccess>> {
  const { data, error } = await client.rpc(DATA_INTAKE_PLANNING_RPC, args);
  if (error) {
    return dataFail("DATABASE_WRITE_ERROR", error.message, {
      code: error.code ?? null,
    });
  }
  return mapDataIntakePlanningRpcPayload(data);
}
