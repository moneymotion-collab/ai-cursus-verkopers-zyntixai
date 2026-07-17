export const REGISTRATION_ERROR_CODES = [
  "invalid_input",
  "email_unavailable",
  "weak_password",
  "rate_limited",
  "email_verification_required",
  "verification_expired",
  "duplicate_request",
  "provisioning_failed",
  "provisioning_incomplete",
  "organization_creation_failed",
  "membership_creation_failed",
  "unauthorized",
  "authenticated_user_cannot_self_register",
  "registration_disabled",
  "temporary_service_failure",
  "configuration_error",
  "unknown_internal_failure",
] as const;

export type RegistrationErrorCode = (typeof REGISTRATION_ERROR_CODES)[number];

const MESSAGES: Record<RegistrationErrorCode, string> = {
  invalid_input: "Please correct the highlighted fields and try again.",
  email_unavailable:
    "If an account exists for this email, sign in or continue from the verification email.",
  weak_password: "Choose a stronger password (at least 8 characters).",
  rate_limited: "Too many attempts. Try again later.",
  email_verification_required: "Verify your email to continue.",
  verification_expired: "This verification link expired. Request a new email.",
  duplicate_request: "This registration is already in progress.",
  provisioning_failed: "Could not finish setting up your account. Try again.",
  provisioning_incomplete: "Finish setting up your account to continue.",
  organization_creation_failed: "Could not finish setting up your account. Try again.",
  membership_creation_failed: "Could not finish setting up your account. Try again.",
  unauthorized: "Sign in to continue.",
  authenticated_user_cannot_self_register: "You are already signed in.",
  registration_disabled: "Public registration is currently unavailable.",
  temporary_service_failure: "Unable to complete registration. Please try again.",
  configuration_error: "Service temporarily unavailable. Please try again later.",
  unknown_internal_failure: "Unable to complete registration. Please try again.",
};

export function registrationErrorMessage(code: RegistrationErrorCode): string {
  return MESSAGES[code];
}

export function normalizeRegistrationAuthError(error: unknown): RegistrationErrorCode {
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
  const status = typeof record.status === "number" ? record.status : null;

  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    message.includes("already registered") ||
    message.includes("user already registered") ||
    message.includes("email address is already")
  ) {
    return "email_unavailable";
  }

  if (
    code === "weak_password" ||
    (message.includes("password") &&
      (message.includes("weak") || message.includes("least")))
  ) {
    return "weak_password";
  }

  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    message.includes("rate limit") ||
    message.includes("only request this after") ||
    message.includes("for security purposes") ||
    status === 429
  ) {
    return "rate_limited";
  }

  if (
    code === "otp_expired" ||
    message.includes("otp_expired") ||
    message.includes("link is invalid or has expired") ||
    message.includes("token has expired")
  ) {
    return "verification_expired";
  }

  if (message.includes("email not confirmed") || code === "email_not_confirmed") {
    return "email_verification_required";
  }

  return "temporary_service_failure";
}

export function normalizeProvisioningError(error: unknown): RegistrationErrorCode {
  if (!error || typeof error !== "object") {
    return "provisioning_failed";
  }

  const record = error as { message?: unknown; code?: unknown };
  const message = typeof record.message === "string" ? record.message.toLowerCase() : "";

  if (message.includes("slug already exists")) {
    return "organization_creation_failed";
  }

  if (message.includes("registration intent required")) {
    return "provisioning_incomplete";
  }

  if (message.includes("email verification required")) {
    return "email_verification_required";
  }

  if (message.includes("not authenticated")) {
    return "unauthorized";
  }

  return "provisioning_failed";
}
