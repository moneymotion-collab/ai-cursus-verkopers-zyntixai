/**
 * Pure Effective Context failures.
 * Not authorization, entitlement, or a public API.
 * No fallback to another Activity, pack, or latest version.
 */

export const CONTEXT_RESOLVER_ERROR_CODES = [
  "NO_PRIMARY_ACTIVITY",
  "ACTIVITY_UNCLASSIFIED",
  "CONTEXT_UNASSIGNED",
  "CONTEXT_NOT_RESOLVABLE_FOR_MODE",
  "CONTEXT_VERSION_NOT_FOUND",
  "PARENT_CONTEXT_NOT_FOUND",
  "PARENT_CONTEXT_CYCLE",
  "CONTEXT_TAXONOMY_MISMATCH",
  "CAPABILITY_NOT_FOUND",
  "CAPABILITY_DEPENDENCY_CYCLE",
  "CATALOG_INTEGRITY_ERROR",
] as const;

export type ContextResolverErrorCode = (typeof CONTEXT_RESOLVER_ERROR_CODES)[number];

export type ContextResolverError = {
  code: ContextResolverErrorCode;
  message: string;
  details?: Readonly<Record<string, unknown>>;
};

export type ContextResolverResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ContextResolverError };

export function contextResolverOk<T>(value: T): ContextResolverResult<T> {
  return { ok: true, value };
}

export function contextResolverFail(
  code: ContextResolverErrorCode,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): ContextResolverResult<never> {
  return {
    ok: false,
    error: details ? { code, message, details } : { code, message },
  };
}
