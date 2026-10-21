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
import type { DataIntakeExecutionOperation } from "@/features/data-intake/domain/authorization";
import {
  DATA_IMPORT_PLAN_STATUSES,
  type DataImportPlanStatus,
} from "@/features/data-intake/domain/planning";
import {
  DATA_IMPORT_ROW_OPERATIONS,
  DATA_IMPORT_ROW_OUTCOMES,
  summarizeExecutionResults,
  type DataImportExecutionSummary,
  type DataImportRowOperation,
  type DataImportRowOutcome,
  type DataImportRowResultView,
} from "@/features/data-intake/domain/execution";
import { DATA_EXECUTABLE_TARGET_DOMAIN } from "@/features/data-intake/domain/constants";
import type { Database } from "@/types/database";

export const DATA_INTAKE_EXECUTION_RPC =
  "apply_data_intake_execution_mutation" as const satisfies keyof Database["public"]["Functions"];

type DataIntakeExecutionFn = Database["public"]["Functions"][typeof DATA_INTAKE_EXECUTION_RPC];

export type DataIntakeExecutionRpcArgs = Omit<
  DataIntakeExecutionFn["Args"],
  "p_operation" | "p_payload"
> & {
  p_operation: DataIntakeExecutionOperation;
  p_payload: Record<string, unknown>;
};

export type DataIntakeExecutionRpcClient = {
  rpc(
    fn: typeof DATA_INTAKE_EXECUTION_RPC,
    args: DataIntakeExecutionRpcArgs,
  ): PromiseLike<{
    data: DataIntakeExecutionFn["Returns"];
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
const OPERATIONS = new Set<string>(DATA_IMPORT_ROW_OPERATIONS);
const OUTCOMES = new Set<string>(DATA_IMPORT_ROW_OUTCOMES);

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

function parseResult(value: unknown): DataImportRowResultView[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((raw): DataImportRowResultView[] => {
    const row = asObject(raw);
    if (
      !row ||
      typeof row.row_fingerprint !== "string" ||
      typeof row.source_row_number !== "number" ||
      typeof row.operation !== "string" ||
      typeof row.outcome !== "string" ||
      !OPERATIONS.has(row.operation) ||
      !OUTCOMES.has(row.outcome)
    ) {
      return [];
    }
    return [
      {
        rowFingerprint: row.row_fingerprint,
        sourceRowNumber: row.source_row_number,
        operation: row.operation as DataImportRowOperation,
        outcome: row.outcome as DataImportRowOutcome,
        targetDomain: DATA_EXECUTABLE_TARGET_DOMAIN,
        targetRecordId: typeof row.target_record_id === "string" ? row.target_record_id : null,
        errorCode: typeof row.error_code === "string" ? row.error_code : null,
      },
    ];
  });
}

function parseSummary(value: unknown, results: DataImportRowResultView[]): DataImportExecutionSummary {
  const row = asObject(value);
  if (
    row &&
    typeof row.imported === "number" &&
    typeof row.failed === "number" &&
    typeof row.skipped === "number" &&
    typeof row.created === "number" &&
    typeof row.linked === "number"
  ) {
    return {
      imported: row.imported,
      failed: row.failed,
      skipped: row.skipped,
      created: row.created,
      linked: row.linked,
    };
  }
  return summarizeExecutionResults(results);
}

export type DataIntakeExecutionRpcSuccess = {
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
  batchIndex: number | null;
  lastCompletedBatchIndex: number | null;
  done: boolean;
  summary: DataImportExecutionSummary | null;
  results: DataImportRowResultView[];
};

export function mapDataIntakeExecutionRpcPayload(
  payload: unknown,
): DataIntakeResult<DataIntakeExecutionRpcSuccess> {
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
  const results = parseResult(row.results);
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
    batchIndex: typeof row.batch_index === "number" ? row.batch_index : null,
    lastCompletedBatchIndex:
      typeof row.last_completed_batch_index === "number" ? row.last_completed_batch_index : null,
    done: row.done === true,
    summary: parseSummary(row.summary, results),
    results,
  });
}

export async function invokeDataIntakeExecutionMutation(
  client: DataIntakeExecutionRpcClient,
  args: DataIntakeExecutionRpcArgs,
): Promise<DataIntakeResult<DataIntakeExecutionRpcSuccess>> {
  const { data, error } = await client.rpc(DATA_INTAKE_EXECUTION_RPC, args);
  if (error) {
    return dataFail("DATABASE_WRITE_ERROR", error.message, {
      code: error.code ?? null,
    });
  }
  return mapDataIntakeExecutionRpcPayload(data);
}
