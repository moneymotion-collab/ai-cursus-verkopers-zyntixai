import type { PostgrestError } from "@supabase/supabase-js";
import type {
  ProgressApplicationError,
  ProgressApplicationErrorCode,
} from "@/features/progress/domain/types";

type NormalizeOptions = {
  fallbackCode?: ProgressApplicationErrorCode;
};

const MESSAGE_RULES: Array<{
  pattern: RegExp;
  code: ProgressApplicationErrorCode;
  message: string;
  retryable: boolean;
  category: ProgressApplicationError["category"];
}> = [
  {
    pattern: /^not authenticated$/i,
    code: "AUTH_REQUIRED",
    message: "Please sign in to continue.",
    retryable: false,
    category: "auth",
  },
  {
    pattern: /^active organization membership required$/i,
    code: "ORG_CONTEXT_MISSING",
    message: "Organization not found or access denied.",
    retryable: false,
    category: "not_found",
  },
  {
    pattern: /^organization not found or not active$/i,
    code: "ORG_CONTEXT_MISSING",
    message: "Organization not found or access denied.",
    retryable: false,
    category: "not_found",
  },
  {
    pattern: /^insufficient role$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^invalid fact type$/i,
    code: "INVALID_FACT_TYPE",
    message: "Select a valid progress fact type.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^invalid progress payload for fact type$/i,
    code: "INVALID_PAYLOAD",
    message: "Provide a valid progress payload.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^correction idempotency key is required$/i,
    code: "INVALID_INPUT",
    message: "A correction requires an idempotency key.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^idempotency key already consumed$/i,
    code: "IDEMPOTENCY_CONFLICT",
    message: "This progress submission was already processed.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^enrollment not found$/i,
    code: "ENROLLMENT_UNAVAILABLE",
    message: "Enrollment not found or access denied.",
    retryable: false,
    category: "not_found",
  },
  {
    pattern: /^enrollment status does not allow progress$/i,
    code: "ENROLLMENT_STATUS_BLOCKS_PROGRESS",
    message: "This enrollment status does not allow progress changes.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^invalid correction reference$/i,
    code: "CORRECTION_NOT_ALLOWED",
    message: "This progress fact cannot be corrected.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^progress fact already has an active correction$/i,
    code: "CORRECTION_NOT_ALLOWED",
    message: "This progress fact already has an active correction.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^progress fact not found$/i,
    code: "PROGRESS_FACT_UNAVAILABLE",
    message: "Progress fact not found or access denied.",
    retryable: false,
    category: "not_found",
  },
  {
    pattern: /^progress fact already voided$/i,
    code: "ALREADY_VOIDED",
    message: "This progress fact is already voided.",
    retryable: false,
    category: "conflict",
  },
];

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

function mapTransportError(error: PostgrestError | Error): ProgressApplicationError {
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

export function normalizeProgressError(
  error: unknown,
  options: NormalizeOptions = {},
): ProgressApplicationError {
  const message = extractMessage(error);

  for (const rule of MESSAGE_RULES) {
    if (rule.pattern.test(message)) {
      return {
        code: rule.code,
        message: rule.message,
        retryable: rule.retryable,
        category: rule.category,
        cause: message,
      };
    }
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
): ProgressApplicationError {
  return {
    code: "INVALID_INPUT",
    message: "Please check the highlighted fields.",
    retryable: false,
    category: "validation",
    fieldErrors,
  };
}

export function validationErrorFromZod(
  fieldErrors: Record<string, string>,
): ProgressApplicationError {
  return invalidInputError(fieldErrors);
}

export function insufficientRoleError(): ProgressApplicationError {
  return {
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  };
}

export function mutationCommittedRefreshRequiredError(): ProgressApplicationError {
  return {
    code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
    message: "Your change was saved. Refresh to see the latest progress fact.",
    retryable: false,
    category: "server",
    refreshRequired: true,
  };
}

export function permissionDeniedError(): ProgressApplicationError {
  return {
    code: "PERMISSION_DENIED",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  };
}

export function orgContextMissingError(): ProgressApplicationError {
  return {
    code: "ORG_CONTEXT_MISSING",
    message: "Organization not found or access denied.",
    retryable: false,
    category: "not_found",
  };
}

export function authRequiredError(): ProgressApplicationError {
  return {
    code: "AUTH_REQUIRED",
    message: "Please sign in to continue.",
    retryable: false,
    category: "auth",
  };
}

export function progressFactUnavailableError(): ProgressApplicationError {
  return {
    code: "PROGRESS_FACT_UNAVAILABLE",
    message: "Progress fact not found or access denied.",
    retryable: false,
    category: "not_found",
  };
}

export function enrollmentUnavailableError(): ProgressApplicationError {
  return {
    code: "ENROLLMENT_UNAVAILABLE",
    message: "Enrollment not found or access denied.",
    retryable: false,
    category: "not_found",
  };
}

export function mapOrganizationContextError(
  error: import("@/features/tasks/domain/types").TaskApplicationError,
): ProgressApplicationError {
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
      return normalizeProgressError(error.message);
  }
}
