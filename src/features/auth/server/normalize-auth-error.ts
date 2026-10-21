const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";
const GENERIC_LOGIN_FAILURE_MESSAGE = "Unable to sign in. Please try again.";
const SESSION_EXPIRED_MESSAGE = "Your session expired. Sign in again.";
const PASSWORD_RESET_SUCCESS_MESSAGE =
  "Your password was updated. Sign in with your new password.";
const RECOVERY_GENERIC_SUCCESS_MESSAGE =
  "If an account exists for this email address, you will receive a password reset link shortly.";
const RECOVERY_EXPIRED_MESSAGE =
  "This password reset link expired or is invalid. Request a new one.";
const RECOVERY_RATE_LIMITED_MESSAGE = "Too many attempts. Try again later.";
const RECOVERY_GENERIC_FAILURE_MESSAGE =
  "Unable to process the password reset. Please try again.";

export function getSessionExpiredMessage(): string {
  return SESSION_EXPIRED_MESSAGE;
}

export function getInvalidCredentialsMessage(): string {
  return INVALID_CREDENTIALS_MESSAGE;
}

export function getPasswordResetSuccessMessage(): string {
  return PASSWORD_RESET_SUCCESS_MESSAGE;
}

export function getRecoveryGenericSuccessMessage(): string {
  return RECOVERY_GENERIC_SUCCESS_MESSAGE;
}

export function getRecoveryExpiredMessage(): string {
  return RECOVERY_EXPIRED_MESSAGE;
}

/**
 * Map provider auth failures to safe product copy. Never return raw provider text.
 * Do not treat every HTTP 400 as invalid credentials — that masks configuration faults.
 */
export function normalizeLoginError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return GENERIC_LOGIN_FAILURE_MESSAGE;
  }

  const record = error as {
    message?: unknown;
    code?: unknown;
    status?: unknown;
    name?: unknown;
  };

  const message = typeof record.message === "string" ? record.message.toLowerCase() : "";
  const code = typeof record.code === "string" ? record.code.toLowerCase() : "";

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password")
  ) {
    return INVALID_CREDENTIALS_MESSAGE;
  }

  if (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed") ||
    message.includes("email_not_confirmed")
  ) {
    return "Verify your email to continue.";
  }

  if (
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    message.includes("rate limit")
  ) {
    return RECOVERY_RATE_LIMITED_MESSAGE;
  }

  return GENERIC_LOGIN_FAILURE_MESSAGE;
}

export type RecoveryErrorCode =
  | "invalid_input"
  | "rate_limited"
  | "recovery_expired"
  | "weak_password"
  | "temporary_service_failure"
  | "configuration_error";

export function normalizeRecoveryRequestError(error: unknown): RecoveryErrorCode {
  if (!error || typeof error !== "object") {
    return "temporary_service_failure";
  }

  const record = error as {
    message?: unknown;
    code?: unknown;
    status?: unknown;
  };

  const message = typeof record.message === "string" ? record.message.toLowerCase() : "";
  const code = typeof record.code === "string" ? record.code.toLowerCase() : "";

  if (
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    message.includes("rate limit") ||
    record.status === 429
  ) {
    return "rate_limited";
  }

  return "temporary_service_failure";
}

export function normalizePasswordUpdateError(error: unknown): RecoveryErrorCode {
  if (!error || typeof error !== "object") {
    return "temporary_service_failure";
  }

  const record = error as {
    message?: unknown;
    code?: unknown;
    status?: unknown;
  };

  const message = typeof record.message === "string" ? record.message.toLowerCase() : "";
  const code = typeof record.code === "string" ? record.code.toLowerCase() : "";

  if (
    code === "weak_password" ||
    (message.includes("password") &&
      (message.includes("weak") || message.includes("least") || message.includes("short")))
  ) {
    return "weak_password";
  }

  if (
    code === "same_password" ||
    message.includes("same password") ||
    message.includes("different from the old password")
  ) {
    return "weak_password";
  }

  if (
    code === "session_not_found" ||
    code === "refresh_token_not_found" ||
    message.includes("session") ||
    message.includes("jwt") ||
    record.status === 401
  ) {
    return "recovery_expired";
  }

  return "temporary_service_failure";
}

export function recoveryErrorMessage(code: RecoveryErrorCode): string {
  switch (code) {
    case "invalid_input":
      return "Please correct the highlighted fields and try again.";
    case "rate_limited":
      return RECOVERY_RATE_LIMITED_MESSAGE;
    case "recovery_expired":
      return RECOVERY_EXPIRED_MESSAGE;
    case "weak_password":
      return "Choose a stronger password (at least 8 characters).";
    case "configuration_error":
      return "Service temporarily unavailable. Please try again later.";
    case "temporary_service_failure":
      return RECOVERY_GENERIC_FAILURE_MESSAGE;
    default:
      return RECOVERY_GENERIC_FAILURE_MESSAGE;
  }
}

export function zodFieldErrors(
  error: import("zod").ZodError,
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") {
      continue;
    }
    if (!fieldErrors[key]) {
      fieldErrors[key] = [];
    }
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}
