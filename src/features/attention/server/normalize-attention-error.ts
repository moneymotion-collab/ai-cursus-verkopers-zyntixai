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

/**
 * Exact raise-exception messages from B1.7.3 Attention RPCs
 * (`supabase/migrations/20260805134825_add_attention_helpers_and_rpcs.sql`).
 */
const ATTENTION_RPC_MESSAGE_RULES: Array<{
  pattern: RegExp;
  code: AttentionApplicationErrorCode;
  message: string;
  category: AttentionApplicationError["category"];
}> = [
  {
    pattern: /^not authenticated$/i,
    code: "AUTH_REQUIRED",
    message: "Please sign in to continue.",
    category: "auth",
  },
  {
    pattern: /^organization not found or not active$/i,
    code: "ORG_CONTEXT_MISSING",
    message: "Organization not found or access denied.",
    category: "not_found",
  },
  {
    pattern: /^active organization membership required$/i,
    code: "ORG_CONTEXT_MISSING",
    message: "Organization not found or access denied.",
    category: "not_found",
  },
  {
    pattern: /^insufficient role$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    category: "permission",
  },
  {
    pattern: /^attention item not found$/i,
    code: "ATTENTION_ITEM_UNAVAILABLE",
    message: "Attention item not found or access denied.",
    category: "not_found",
  },
  {
    pattern: /^enrollment not found$/i,
    code: "ENROLLMENT_UNAVAILABLE",
    message: "Enrollment not found or access denied.",
    category: "not_found",
  },
  {
    pattern: /^invalid member assignment for organization$/i,
    code: "INVALID_INPUT",
    message: "Select a valid organization member.",
    category: "validation",
  },
  {
    pattern: /^invalid attention title$/i,
    code: "INVALID_INPUT",
    message: "Provide a valid attention title.",
    category: "validation",
  },
  {
    pattern: /^invalid attention summary$/i,
    code: "INVALID_INPUT",
    message: "Provide a valid attention summary.",
    category: "validation",
  },
  {
    pattern: /^invalid attention severity$/i,
    code: "INVALID_INPUT",
    message: "Select a valid attention severity.",
    category: "validation",
  },
  {
    pattern: /^invalid attention signal explanation$/i,
    code: "INVALID_INPUT",
    message: "Provide a valid signal explanation.",
    category: "validation",
  },
  {
    pattern: /^invalid attention signal evidence$/i,
    code: "INVALID_INPUT",
    message: "Provide valid signal evidence.",
    category: "validation",
  },
  {
    pattern: /^invalid attention signal origin/i,
    code: "INVALID_INPUT",
    message: "Provide a valid signal origin.",
    category: "validation",
  },
  {
    pattern: /^invalid attention rule key$/i,
    code: "INVALID_INPUT",
    message: "Provide a valid attention rule key.",
    category: "validation",
  },
  {
    pattern: /^resolution reason required$/i,
    code: "INVALID_INPUT",
    message: "A resolution reason is required.",
    category: "validation",
  },
  {
    pattern: /^dismissal reason required$/i,
    code: "INVALID_INPUT",
    message: "A dismissal reason is required.",
    category: "validation",
  },
  {
    pattern: /^attention item is archived$/i,
    code: "INVALID_STATE",
    message: "This attention item is archived.",
    category: "conflict",
  },
  {
    pattern: /^attention item is terminal$/i,
    code: "INVALID_STATE",
    message: "This attention item is already closed.",
    category: "conflict",
  },
  {
    pattern: /^invalid attention status transition$/i,
    code: "INVALID_STATE",
    message: "This attention status change is not allowed.",
    category: "conflict",
  },
  {
    pattern: /^only terminal attention items can be archived$/i,
    code: "INVALID_STATE",
    message: "Only closed attention items can be archived.",
    category: "conflict",
  },
  {
    pattern: /^attention item already archived$/i,
    code: "CONFLICT",
    message: "This attention item is already archived.",
    category: "conflict",
  },
  {
    pattern: /^attention item already open for dedupe key$/i,
    code: "CONFLICT",
    message: "An open attention item already exists for this enrollment signal.",
    category: "conflict",
  },
];

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

  for (const rule of ATTENTION_RPC_MESSAGE_RULES) {
    if (rule.pattern.test(message)) {
      return {
        code: rule.code,
        message: rule.message,
        retryable: false,
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
): AttentionApplicationError {
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
): AttentionApplicationError {
  return invalidInputError(fieldErrors);
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
