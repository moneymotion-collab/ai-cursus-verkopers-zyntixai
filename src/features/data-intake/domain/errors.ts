/**
 * DATA-1C error vocabulary. Internal server failures, not a public API.
 */

export const DATA_INTAKE_ERROR_CODES = [
  "UNAUTHORIZED",
  "ORG_NOT_FOUND",
  "FORBIDDEN_ROLE",
  "TARGET_NOT_SUPPORTED",
  "ACTIVITY_NOT_ALLOWED_FOR_TARGET",
  "ACTIVITY_NOT_FOUND",
  "SESSION_NOT_FOUND",
  "UNSUPPORTED_FILE",
  "FILE_TOO_LARGE",
  "SOURCE_INVALID",
  "SOURCE_HASH_INVALID",
  "INVALID_STATE",
  "DATABASE_READ_ERROR",
  "DATABASE_WRITE_ERROR",
] as const;

export type DataIntakeErrorCode = (typeof DATA_INTAKE_ERROR_CODES)[number];

export type DataIntakeError = {
  code: DataIntakeErrorCode;
  message: string;
  details?: Readonly<Record<string, unknown>>;
};

export type DataIntakeResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: DataIntakeError };

export function dataOk<T>(value: T): DataIntakeResult<T> {
  return { ok: true, value };
}

export function dataFail(
  code: DataIntakeErrorCode,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): DataIntakeResult<never> {
  return {
    ok: false,
    error: details ? { code, message, details } : { code, message },
  };
}

export function isDataIntakeErrorCode(value: string): value is DataIntakeErrorCode {
  return (DATA_INTAKE_ERROR_CODES as readonly string[]).includes(value);
}
