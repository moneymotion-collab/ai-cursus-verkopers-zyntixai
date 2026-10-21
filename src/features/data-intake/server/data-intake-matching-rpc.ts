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
import type { DataIntakeMatchingOperation } from "@/features/data-intake/domain/authorization";
import type { DataMatchSummary } from "@/features/data-intake/domain/matching";
import type { Database } from "@/types/database";

export const DATA_INTAKE_MATCHING_RPC =
  "apply_data_intake_matching_mutation" as const satisfies keyof Database["public"]["Functions"];

type DataIntakeMatchingFn = Database["public"]["Functions"][typeof DATA_INTAKE_MATCHING_RPC];

export type DataIntakeMatchingRpcArgs = Omit<
  DataIntakeMatchingFn["Args"],
  "p_operation" | "p_payload"
> & {
  p_operation: DataIntakeMatchingOperation;
  p_payload: Record<string, unknown>;
};

export type DataIntakeMatchingRpcClient = {
  rpc(
    fn: typeof DATA_INTAKE_MATCHING_RPC,
    args: DataIntakeMatchingRpcArgs,
  ): PromiseLike<{
    data: DataIntakeMatchingFn["Returns"];
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

function asSourceKind(value: unknown) {
  return typeof value === "string" && isDataSourceKind(value) ? value : null;
}

export type DataIntakeMatchingRpcSuccess = {
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
  summary: DataMatchSummary | null;
};

export function mapDataIntakeMatchingRpcPayload(
  payload: unknown,
): DataIntakeResult<DataIntakeMatchingRpcSuccess> {
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
    typeof summaryRaw.eligible_rows === "number" &&
    typeof summaryRaw.exact_matches === "number" &&
    typeof summaryRaw.no_matches === "number" &&
    typeof summaryRaw.no_key_rows === "number" &&
    typeof summaryRaw.ambiguous_rows === "number" &&
    typeof summaryRaw.collisions === "number" &&
    typeof summaryRaw.blocked_skipped === "number" &&
    typeof summaryRaw.matcher_version === "string"
      ? {
          matcherVersion: "customer-matcher-v1" as const,
          matchKey: "email" as const,
          eligibleRows: summaryRaw.eligible_rows,
          exactMatches: summaryRaw.exact_matches,
          noMatches: summaryRaw.no_matches,
          noKeyRows: summaryRaw.no_key_rows,
          ambiguousRows: summaryRaw.ambiguous_rows,
          collisions: summaryRaw.collisions,
          blockedSkipped: summaryRaw.blocked_skipped,
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

export async function invokeDataIntakeMatchingMutation(
  client: DataIntakeMatchingRpcClient,
  args: DataIntakeMatchingRpcArgs,
): Promise<DataIntakeResult<DataIntakeMatchingRpcSuccess>> {
  const { data, error } = await client.rpc(DATA_INTAKE_MATCHING_RPC, args);
  if (error) {
    return dataFail("DATABASE_WRITE_ERROR", error.message, {
      code: error.code ?? null,
    });
  }
  return mapDataIntakeMatchingRpcPayload(data);
}
