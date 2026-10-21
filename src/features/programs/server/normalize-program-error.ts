import type { PostgrestError } from "@supabase/supabase-js";
import type {
  ProgramApplicationError,
  ProgramApplicationErrorCode,
} from "@/features/programs/domain/types";

type NormalizeOptions = {
  fallbackCode?: ProgramApplicationErrorCode;
};

const MESSAGE_RULES: Array<{
  pattern: RegExp;
  code: ProgramApplicationErrorCode;
  message: string;
  retryable: boolean;
  category: ProgramApplicationError["category"];
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
    pattern: /^insufficient role to create programs$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^insufficient role to update programs$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^insufficient role to transition program status$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^insufficient role to archive programs$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^insufficient role to restore programs$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^name is required$/i,
    code: "INVALID_INPUT",
    message: "Please check the highlighted fields.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^invalid delivery_mode$/i,
    code: "INVALID_DELIVERY_MODE",
    message: "Select a valid delivery mode.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^program name already exists in organization$/i,
    code: "DUPLICATE_PROGRAM",
    message: "A program with this name already exists in your organization.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^program not found$/i,
    code: "PROGRAM_UNAVAILABLE",
    message: "Program not found or access denied.",
    retryable: false,
    category: "not_found",
  },
  {
    pattern: /^program not found or archived$/i,
    code: "PROGRAM_UNAVAILABLE",
    message: "Program not found or access denied.",
    retryable: false,
    category: "not_found",
  },
  {
    pattern: /^program not found or already archived$/i,
    code: "PROGRAM_UNAVAILABLE",
    message: "Program not found or access denied.",
    retryable: false,
    category: "not_found",
  },
  {
    pattern: /^program not found or not archived$/i,
    code: "NOT_ARCHIVED",
    message: "Program not found or is not archived.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^archived programs cannot transition status$/i,
    code: "ARCHIVED_RECORD",
    message: "Archived programs cannot be changed.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^status transition is a no-op$/i,
    code: "INVALID_STATE",
    message: "This program changed and must be reloaded.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^status transition not allowed$/i,
    code: "TRANSITION_NOT_ALLOWED",
    message: "This status change is not allowed.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^cannot archive program with open enrollments$/i,
    code: "ARCHIVE_BLOCKED_OPEN_ENROLLMENTS",
    message: "Cannot archive a program that still has open enrollments.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^invalid source$/i,
    code: "INVALID_INPUT",
    message: "Please check the highlighted fields.",
    retryable: false,
    category: "validation",
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

function mapTransportError(error: PostgrestError | Error): ProgramApplicationError {
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

export function normalizeProgramError(
  error: unknown,
  options: NormalizeOptions = {},
): ProgramApplicationError {
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
    "code" in error &&
    (error as PostgrestError).code === "23505"
  ) {
    return {
      code: "DUPLICATE_PROGRAM",
      message: "A program with this name already exists in your organization.",
      retryable: false,
      category: "conflict",
      cause: message,
    };
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

export function zodErrorToFieldMap(error: import("zod").ZodError): Record<string, string> {
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
): ProgramApplicationError {
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
): ProgramApplicationError {
  return invalidInputError(fieldErrors);
}

export function insufficientRoleError(): ProgramApplicationError {
  return {
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  };
}

export function archivedRecordError(): ProgramApplicationError {
  return {
    code: "ARCHIVED_RECORD",
    message: "Archived programs cannot be changed.",
    retryable: false,
    category: "conflict",
  };
}

export function mutationCommittedRefreshRequiredError(): ProgramApplicationError {
  return {
    code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
    message: "Your change was saved. Refresh to see the latest program.",
    retryable: false,
    category: "server",
    refreshRequired: true,
  };
}

export function permissionDeniedError(): ProgramApplicationError {
  return {
    code: "PERMISSION_DENIED",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  };
}

export function orgContextMissingError(): ProgramApplicationError {
  return {
    code: "ORG_CONTEXT_MISSING",
    message: "Organization not found or access denied.",
    retryable: false,
    category: "not_found",
  };
}

export function authRequiredError(): ProgramApplicationError {
  return {
    code: "AUTH_REQUIRED",
    message: "Please sign in to continue.",
    retryable: false,
    category: "auth",
  };
}

export function programUnavailableError(): ProgramApplicationError {
  return {
    code: "PROGRAM_UNAVAILABLE",
    message: "Program not found or access denied.",
    retryable: false,
    category: "not_found",
  };
}

export function mapOrganizationContextError(
  error: import("@/features/tasks/domain/types").TaskApplicationError,
): ProgramApplicationError {
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
      return normalizeProgramError(error.message);
  }
}
