import "server-only";

import {
  dataFail,
  dataOk,
  isDataIntakeErrorCode,
  type DataIntakeErrorCode,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import { isDataSourceKind } from "@/features/data-intake/domain/constants";
import type {
  DataIntakeFoundationSuccess,
  DataIntakeSessionStatus,
} from "@/features/data-intake/domain/types";
import type { DataIntakeFoundationOperation } from "@/features/data-intake/domain/authorization";

export const DATA_INTAKE_FOUNDATION_RPC = "apply_data_intake_foundation_mutation" as const;

export type DataIntakeFoundationRpcArgs = {
  p_operation: DataIntakeFoundationOperation;
  p_organization_id: string;
  p_actor_user_id: string;
  p_actor_member_id: string;
  p_payload: Record<string, unknown>;
};

export type DataIntakeFoundationRpcClient = {
  rpc(
    fn: typeof DATA_INTAKE_FOUNDATION_RPC,
    args: DataIntakeFoundationRpcArgs,
  ): PromiseLike<{
    data: unknown;
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

export function mapDataIntakeFoundationRpcPayload(
  payload: unknown,
): DataIntakeResult<DataIntakeFoundationSuccess> {
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
  const sourceKind =
    typeof row.source_kind === "string" && isDataSourceKind(row.source_kind)
      ? row.source_kind
      : null;
  if (
    row.ok !== true ||
    typeof row.session_id !== "string" ||
    typeof row.target_domain !== "string" ||
    !status ||
    !sourceKind
  ) {
    return dataFail("DATABASE_WRITE_ERROR", "DATA mutation returned an incomplete result");
  }
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
  });
}

export async function invokeDataIntakeFoundationMutation(
  client: DataIntakeFoundationRpcClient,
  args: DataIntakeFoundationRpcArgs,
): Promise<DataIntakeResult<DataIntakeFoundationSuccess>> {
  const { data, error } = await client.rpc(DATA_INTAKE_FOUNDATION_RPC, args);
  if (error) {
    return dataFail("DATABASE_WRITE_ERROR", error.message, {
      code: error.code ?? null,
    });
  }
  return mapDataIntakeFoundationRpcPayload(data);
}
