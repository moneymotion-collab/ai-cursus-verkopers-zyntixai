/**
 * Internal server control-plane read failures.
 * Not a public/browser API. Not tenant authorization.
 */

export const CONTROL_PLANE_ERROR_CODES = [
  "NOT_FOUND",
  "AMBIGUOUS",
  "CATALOG_INTEGRITY_ERROR",
  "UNSUPPORTED_STATE",
  "DATABASE_READ_ERROR",
] as const;

export type ControlPlaneErrorCode = (typeof CONTROL_PLANE_ERROR_CODES)[number];

export type ControlPlaneError = {
  code: ControlPlaneErrorCode;
  message: string;
  details?: Readonly<Record<string, unknown>>;
};

export type ControlPlaneResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ControlPlaneError };

export function controlPlaneOk<T>(value: T): ControlPlaneResult<T> {
  return { ok: true, value };
}

export function controlPlaneFail(
  code: ControlPlaneErrorCode,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): ControlPlaneResult<never> {
  return {
    ok: false,
    error: details ? { code, message, details } : { code, message },
  };
}
