import "server-only";

import {
  bqaFail,
  bqaOk,
  type BqaErrorCode,
  type BqaResult,
} from "@/features/business-qualification/domain/errors";
import type {
  BqaMutationOperation,
  BqaMutationSuccess,
  QualificationEventType,
} from "@/features/business-qualification/domain/types";
import type { Database } from "@/types/database";

export const BQA_MUTATION_RPC =
  "apply_business_qualification_mutation" as const satisfies keyof Database["public"]["Functions"];

type BqaMutationFn = Database["public"]["Functions"][typeof BQA_MUTATION_RPC];

export type BqaMutationRpcArgs = Omit<BqaMutationFn["Args"], "p_operation" | "p_payload"> & {
  p_operation: BqaMutationOperation;
  p_payload: Record<string, unknown>;
};

export type BqaMutationRpcClient = {
  rpc(
    fn: typeof BQA_MUTATION_RPC,
    args: BqaMutationRpcArgs,
  ): PromiseLike<{
    data: BqaMutationFn["Returns"];
    error: { message: string; code?: string } | null;
  }>;
};

const EVENT_TYPES = new Set<QualificationEventType>([
  "qualification_started",
  "answer_saved",
  "classification_proposed",
  "classification_confirmed",
  "classification_superseded",
  "review_requested",
  "split_recommended",
  "requalify_started",
  "support_assessed",
  "admission_decided",
  "waitlist_joined",
  "waitlist_withdrawn",
]);

const ERROR_CODES = new Set<BqaErrorCode>([
  "UNAUTHORIZED",
  "ORG_NOT_FOUND",
  "ACTIVITY_NOT_FOUND",
  "QUALIFICATION_NOT_FOUND",
  "QUESTION_NOT_ALLOWED",
  "INVALID_ANSWER",
  "CLASSIFICATION_NOT_READY",
  "CLASSIFICATION_AMBIGUOUS",
  "CLASSIFICATION_UNKNOWN",
  "CLASSIFICATION_REVIEW_REQUIRED",
  "CLASSIFICATION_TARGET_NOT_FOUND",
  "CLASSIFICATION_TARGET_INVALID",
  "CLASSIFICATION_ALREADY_CONFIRMED",
  "CLASSIFICATION_NOT_CONFIRMED",
  "REQUALIFICATION_REQUIRED",
  "SUPPORT_ASSESSMENT_NOT_READY",
  "CONTEXT_PACK_NOT_FOUND",
  "NO_ELIGIBLE_CONTEXT_VERSION",
  "ROLLOUT_POLICY_UNDEFINED",
  "ADMISSION_NOT_ELIGIBLE",
  "FORBIDDEN_ROLE",
  "DATABASE_READ_ERROR",
  "DATABASE_WRITE_ERROR",
  "CATALOG_INTEGRITY_ERROR",
]);

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function parseEventType(value: unknown): QualificationEventType | null {
  return typeof value === "string" && EVENT_TYPES.has(value as QualificationEventType)
    ? (value as QualificationEventType)
    : null;
}

function parseErrorCode(value: unknown): BqaErrorCode {
  return typeof value === "string" && ERROR_CODES.has(value as BqaErrorCode)
    ? (value as BqaErrorCode)
    : "DATABASE_WRITE_ERROR";
}

export function mapBqaMutationRpcPayload(
  payload: unknown,
): BqaResult<BqaMutationSuccess> {
  const row = asObject(payload);
  if (!row) {
    return bqaFail("DATABASE_WRITE_ERROR", "BQA mutation returned an invalid payload");
  }
  if (row.ok === false) {
    return bqaFail(
      parseErrorCode(row.code),
      typeof row.message === "string" ? row.message : "BQA mutation failed",
    );
  }
  if (row.ok !== true || typeof row.qualification_id !== "string") {
    return bqaFail("DATABASE_WRITE_ERROR", "BQA mutation returned an incomplete result");
  }
  return bqaOk({
    idempotent: row.idempotent === true,
    qualificationId: row.qualification_id,
    decisionId: typeof row.decision_id === "string" ? row.decision_id : null,
    answerId: typeof row.answer_id === "string" ? row.answer_id : null,
    assessmentId: typeof row.assessment_id === "string" ? row.assessment_id : null,
    admissionId: typeof row.admission_id === "string" ? row.admission_id : null,
    demandSignalId: typeof row.demand_signal_id === "string" ? row.demand_signal_id : null,
    eventId: typeof row.event_id === "string" ? row.event_id : null,
    eventType: parseEventType(row.event_type),
  });
}

export async function invokeBqaMutation(
  client: BqaMutationRpcClient,
  args: BqaMutationRpcArgs,
): Promise<BqaResult<BqaMutationSuccess>> {
  const { data, error } = await client.rpc(BQA_MUTATION_RPC, args);
  if (error) {
    return bqaFail("DATABASE_WRITE_ERROR", error.message, {
      code: error.code ?? null,
    });
  }
  return mapBqaMutationRpcPayload(data);
}
