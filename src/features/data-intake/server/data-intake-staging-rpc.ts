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
import type { DataIntakeStagingOperation } from "@/features/data-intake/domain/authorization";
import type { DataStagingSummary } from "@/features/data-intake/domain/staging";
import type { Database } from "@/types/database";

export const DATA_INTAKE_STAGING_RPC =
  "apply_data_intake_staging_mutation" as const satisfies keyof Database["public"]["Functions"];

type DataIntakeStagingFn = Database["public"]["Functions"][typeof DATA_INTAKE_STAGING_RPC];

export type DataIntakeStagingRpcArgs = Omit<
  DataIntakeStagingFn["Args"],
  "p_operation" | "p_payload"
> & {
  p_operation: DataIntakeStagingOperation;
  p_payload: Record<string, unknown>;
};

export type DataIntakeStagingRpcClient = {
  rpc(
    fn: typeof DATA_INTAKE_STAGING_RPC,
    args: DataIntakeStagingRpcArgs,
  ): PromiseLike<{
    data: DataIntakeStagingFn["Returns"];
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

export type DataIntakeStagingRpcSuccess = {
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
  mappingHash: string | null;
  summary: DataStagingSummary | null;
};

function asSourceKind(value: unknown) {
  return typeof value === "string" && isDataSourceKind(value) ? value : null;
}

export function mapDataIntakeStagingRpcPayload(
  payload: unknown,
): DataIntakeResult<DataIntakeStagingRpcSuccess> {
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
  const summaryRaw = asObject(row.summary);
  const summary =
    summaryRaw &&
    typeof summaryRaw.source_data_rows === "number" &&
    typeof summaryRaw.staged_rows === "number" &&
    typeof summaryRaw.valid_rows === "number" &&
    typeof summaryRaw.invalid_rows === "number" &&
    typeof summaryRaw.mapping_hash === "string" &&
    typeof summaryRaw.source_sha256 === "string"
      ? {
          sourceDataRows: summaryRaw.source_data_rows,
          stagedRows: summaryRaw.staged_rows,
          validRows: summaryRaw.valid_rows,
          invalidRows: summaryRaw.invalid_rows,
          mappingHash: summaryRaw.mapping_hash,
          sourceSha256: summaryRaw.source_sha256,
        }
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
    mappingHash: typeof row.mapping_hash === "string" ? row.mapping_hash : null,
    summary,
  });
}

export async function invokeDataIntakeStagingMutation(
  client: DataIntakeStagingRpcClient,
  args: DataIntakeStagingRpcArgs,
): Promise<DataIntakeResult<DataIntakeStagingRpcSuccess>> {
  const { data, error } = await client.rpc(DATA_INTAKE_STAGING_RPC, args);
  if (error) {
    return dataFail("DATABASE_WRITE_ERROR", error.message, {
      code: error.code ?? null,
    });
  }
  return mapDataIntakeStagingRpcPayload(data);
}
