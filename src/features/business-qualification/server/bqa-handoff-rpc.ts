import "server-only";

import {
  bqaFail,
  bqaOk,
  type BqaErrorCode,
  type BqaResult,
} from "@/features/business-qualification/domain/errors";
import type { BqaAssignmentHandoffSuccess } from "@/features/business-qualification/domain/types";

export const BQA_HANDOFF_RPC = "apply_business_qualification_assignment_handoff" as const;

export type BqaHandoffRpcArgs = {
  p_organization_id: string;
  p_business_activity_id: string;
  p_actor_user_id: string;
  p_admission_decision_id: string;
  p_rollout_mode: string;
};

export type BqaHandoffRpcClient = {
  rpc(
    fn: typeof BQA_HANDOFF_RPC,
    args: BqaHandoffRpcArgs,
  ): PromiseLike<{
    data: unknown;
    error: { message: string; code?: string } | null;
  }>;
};

const ERROR_CODES = new Set<BqaErrorCode>([
  "UNAUTHORIZED",
  "ORG_NOT_FOUND",
  "ACTIVITY_NOT_FOUND",
  "QUALIFICATION_NOT_FOUND",
  "CLASSIFICATION_NOT_CONFIRMED",
  "CLASSIFICATION_REVIEW_REQUIRED",
  "REQUALIFICATION_REQUIRED",
  "SUPPORT_ASSESSMENT_NOT_READY",
  "CONTEXT_PACK_NOT_FOUND",
  "ROLLOUT_POLICY_UNDEFINED",
  "ADMISSION_NOT_ELIGIBLE",
  "ADMISSION_NOT_FOUND",
  "ADMISSION_STALE",
  "ROLLOUT_MISMATCH",
  "CONTEXT_VERSION_INVALID",
  "CONTEXT_READINESS_NO_LONGER_ELIGIBLE",
  "CONTEXT_REPIN_REQUIRED",
  "ACTIVITY_CLASSIFICATION_MISMATCH",
  "ACTIVITY_ARCHIVED",
  "HANDOFF_FAILED",
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

function parseErrorCode(value: unknown): BqaErrorCode {
  return typeof value === "string" && ERROR_CODES.has(value as BqaErrorCode)
    ? (value as BqaErrorCode)
    : "HANDOFF_FAILED";
}

function nestedCodeFromMessage(message: string): BqaErrorCode | null {
  const match = message.match(/HANDOFF_NESTED:([A-Z_]+)/);
  if (!match?.[1]) {
    return null;
  }
  return parseErrorCode(match[1]);
}

export function mapBqaHandoffRpcPayload(
  payload: unknown,
): BqaResult<BqaAssignmentHandoffSuccess> {
  const row = asObject(payload);
  if (!row) {
    return bqaFail("HANDOFF_FAILED", "BQA assignment handoff returned an invalid payload");
  }
  if (row.ok === false) {
    return bqaFail(
      parseErrorCode(row.code),
      typeof row.message === "string" ? row.message : "BQA assignment handoff failed",
    );
  }
  if (
    row.ok !== true ||
    typeof row.organization_id !== "string" ||
    typeof row.business_activity_id !== "string" ||
    typeof row.admission_decision_id !== "string" ||
    typeof row.context_pack_version_id !== "string"
  ) {
    return bqaFail("HANDOFF_FAILED", "BQA assignment handoff returned an incomplete result");
  }
  return bqaOk({
    ok: true,
    idempotent: row.idempotent === true,
    organizationId: row.organization_id,
    businessActivityId: row.business_activity_id,
    admissionDecisionId: row.admission_decision_id,
    classificationApplied: row.classification_applied === true,
    activationApplied: row.activation_applied === true,
    assignmentApplied: row.assignment_applied === true,
    assignmentId: typeof row.assignment_id === "string" ? row.assignment_id : null,
    contextPackVersionId: row.context_pack_version_id,
  });
}

export async function invokeBqaAssignmentHandoff(
  client: BqaHandoffRpcClient,
  args: BqaHandoffRpcArgs,
): Promise<BqaResult<BqaAssignmentHandoffSuccess>> {
  const { data, error } = await client.rpc(BQA_HANDOFF_RPC, args);
  if (error) {
    const nested = nestedCodeFromMessage(error.message);
    if (nested) {
      return bqaFail(nested, error.message);
    }
    return bqaFail("HANDOFF_FAILED", error.message, {
      code: error.code ?? null,
    });
  }
  return mapBqaHandoffRpcPayload(data);
}
