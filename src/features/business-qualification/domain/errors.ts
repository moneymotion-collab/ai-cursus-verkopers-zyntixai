/**
 * Internal BQA qualification/classification server failures.
 * Not a public/browser API. No silent fallback to another Organization.
 */

export const BQA_ERROR_CODES = [
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
] as const;

export type BqaErrorCode = (typeof BQA_ERROR_CODES)[number];

export type BqaError = {
  code: BqaErrorCode;
  message: string;
  details?: Readonly<Record<string, unknown>>;
};

export type BqaResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: BqaError };

export function bqaOk<T>(value: T): BqaResult<T> {
  return { ok: true, value };
}

export function bqaFail(
  code: BqaErrorCode,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): BqaResult<never> {
  return {
    ok: false,
    error: details ? { code, message, details } : { code, message },
  };
}
