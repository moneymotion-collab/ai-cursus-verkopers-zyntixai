import type { PostgrestError } from "@supabase/supabase-js";
import type {
  AttentionApplicationError,
  AttentionApplicationErrorCode,
} from "@/features/attention/domain/types";
import type { TaskApplicationError } from "@/features/tasks/domain/types";

type NormalizeOptions = {
  fallbackCode?: AttentionApplicationErrorCode;
};

function extractMessage(error: unknown): string {
  if (!error) {
    return "";
  }

  if (typeof error === "string") {
    return error.trim();
  }

  if (error instanceof Error) {
    return error.message.trim();
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message.trim() : "";
  }

  return "";
}

const MISSING_SESSION_MESSAGE = /^auth session missing!$/i;

export function isMissingAuthSessionError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (typeof error === "object" && error !== null) {
    const authError = error as {
      name?: string;
      code?: string;
      message?: string;
    };

    if (authError.name === "AuthSessionMissingError") {
      return true;
    }

    if (authError.code === "session_not_found") {
      return true;
    }

    if (MISSING_SESSION_MESSAGE.test(extractMessage(error))) {
      return true;
    }
  }

  return false;
}

function mapTransportError(error: PostgrestError | Error): AttentionApplicationError {
  const message = extractMessage(error);
  const lower = message.toLowerCase();

  if (lower.includes("fetch failed") || lower.includes("network")) {
    return {
      code: "NETWORK_ERROR",
      message: "Connection problem. Check your network.",
      retryable: true,
      category: "network",
      cause: message,
    };
  }

  if ("code" in error && error.code === "PGRST301") {
    return {
      code: "AUTH_REQUIRED",
      message: "Please sign in to continue.",
      retryable: false,
      category: "auth",
      cause: message,
    };
  }

  if ("status" in error && typeof error.status === "number") {
    if (error.status === 429) {
      return {
        code: "RATE_LIMITED",
        message: "Too many requests. Wait a moment.",
        retryable: true,
        category: "network",
        cause: message,
      };
    }

    if (error.status >= 500) {
      return {
        code: "DATABASE_UNAVAILABLE",
        message: "Service temporarily unavailable.",
        retryable: true,
        category: "server",
        cause: message,
      };
    }
  }

  return {
    code: "UNEXPECTED_ERROR",
    message: "Something went wrong. Try again.",
    retryable: true,
    category: "server",
    cause: message,
  };
}

export function normalizeAttentionError(
  error: unknown,
  options: NormalizeOptions = {},
): AttentionApplicationError {
  const message = extractMessage(error);

  if (/^not authenticated$/i.test(message)) {
    return authRequiredError();
  }

  if (
    /^active organization membership required$/i.test(message) ||
    /^organization not found or not active$/i.test(message)
  ) {
    return orgContextMissingError();
  }

  if (/^insufficient role$/i.test(message)) {
    return insufficientRoleError();
  }

  if (/^attention item not found$/i.test(message)) {
    return attentionItemUnavailableError();
  }

  if (/^enrollment not found$/i.test(message)) {
    return enrollmentUnavailableError();
  }

  if (
    error &&
    typeof error === "object" &&
    ("code" in error || "details" in error || "status" in error)
  ) {
    return mapTransportError(error as PostgrestError);
  }

  if (error instanceof Error) {
    return mapTransportError(error);
  }

  return {
    code: options.fallbackCode ?? "UNEXPECTED_ERROR",
    message: "Something went wrong. Try again.",
    retryable: true,
    category: "server",
    cause: message || undefined,
  };
}

export function zodErrorToFieldMap(
  error: import("zod").ZodError,
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "form";
    if (!fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }

  return fieldErrors;
}

export function invalidInputError(
  fieldErrors?: Record<string, string>,
): AttentionApplicationError {
  return {
    code: "INVALID_INPUT",
    message: "Please check the highlighted fields.",
    retryable: false,
    category: "validation",
    fieldErrors,
  };
}

export function insufficientRoleError(): AttentionApplicationError {
  return {
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  };
}

export function permissionDeniedError(): AttentionApplicationError {
  return {
    code: "PERMISSION_DENIED",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  };
}

export function orgContextMissingError(): AttentionApplicationError {
  return {
    code: "ORG_CONTEXT_MISSING",
    message: "Organization not found or access denied.",
    retryable: false,
    category: "not_found",
  };
}

export function authRequiredError(): AttentionApplicationError {
  return {
    code: "AUTH_REQUIRED",
    message: "Please sign in to continue.",
    retryable: false,
    category: "auth",
  };
}

export function attentionItemUnavailableError(): AttentionApplicationError {
  return {
    code: "ATTENTION_ITEM_UNAVAILABLE",
    message: "Attention item not found or access denied.",
    retryable: false,
    category: "not_found",
  };
}

export function enrollmentUnavailableError(): AttentionApplicationError {
  return {
    code: "ENROLLMENT_UNAVAILABLE",
    message: "Enrollment not found or access denied.",
    retryable: false,
    category: "not_found",
  };
}

export function invalidStateError(
  message = "This attention item cannot be mapped safely.",
): AttentionApplicationError {
  return {
    code: "INVALID_STATE",
    message,
    retryable: false,
    category: "conflict",
  };
}

export function mapOrganizationContextError(
  error: TaskApplicationError,
): AttentionApplicationError {
  switch (error.code) {
    case "AUTH_REQUIRED":
    case "SESSION_EXPIRED":
      return authRequiredError();
    case "ORG_CONTEXT_MISSING":
      return orgContextMissingError();
    case "PERMISSION_DENIED":
    case "INSUFFICIENT_ROLE":
      return permissionDeniedError();
    default:
      return normalizeAttentionError(error.message);
  }
}
