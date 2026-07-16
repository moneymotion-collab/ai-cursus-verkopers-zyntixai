const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";
const GENERIC_LOGIN_FAILURE_MESSAGE = "Unable to sign in. Please try again.";
const SESSION_EXPIRED_MESSAGE = "Your session expired. Sign in again.";

export function getSessionExpiredMessage(): string {
  return SESSION_EXPIRED_MESSAGE;
}

export function getInvalidCredentialsMessage(): string {
  return INVALID_CREDENTIALS_MESSAGE;
}

/**
 * Map provider auth failures to safe product copy. Never return raw provider text.
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
  const status = typeof record.status === "number" ? record.status : null;

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password") ||
    status === 400
  ) {
    return INVALID_CREDENTIALS_MESSAGE;
  }

  return GENERIC_LOGIN_FAILURE_MESSAGE;
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
