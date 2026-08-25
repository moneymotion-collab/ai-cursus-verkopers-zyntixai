/**
 * Internal server ORG-CONTEXT failures.
 * Not a public/browser API. No silent fallback to another Organization.
 */

export const ORG_CONTEXT_ERROR_CODES = [
  "ORG_NOT_FOUND",
  "ACTIVITY_NOT_FOUND",
  "ACTIVITY_NOT_OWNED_BY_ORG",
  "CLASSIFICATION_NOT_FOUND",
  "CONTEXT_NOT_AVAILABLE",
  "CONTEXT_INCOMPATIBLE",
  "CONTEXT_VERSION_NOT_ASSIGNABLE",
  "PRIMARY_ACTIVITY_CONFLICT",
  "UNAUTHORIZED",
  "CATALOG_INTEGRITY_ERROR",
  "DATABASE_READ_ERROR",
  "MUTATION_FAILED",
] as const;

export type OrgContextErrorCode = (typeof ORG_CONTEXT_ERROR_CODES)[number];

export type OrgContextError = {
  code: OrgContextErrorCode;
  message: string;
  details?: Readonly<Record<string, unknown>>;
};

export type OrgContextResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: OrgContextError };

export function orgContextOk<T>(value: T): OrgContextResult<T> {
  return { ok: true, value };
}

export function orgContextFail(
  code: OrgContextErrorCode,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): OrgContextResult<never> {
  return {
    ok: false,
    error: details ? { code, message, details } : { code, message },
  };
}
