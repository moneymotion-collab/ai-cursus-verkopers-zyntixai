import type { PostgrestError } from "@supabase/supabase-js";
import type {
  EnrollmentApplicationError,
  EnrollmentApplicationErrorCode,
} from "@/features/enrollments/domain/types";

type NormalizeOptions = {
  fallbackCode?: EnrollmentApplicationErrorCode;
};

const MESSAGE_RULES: Array<{
  pattern: RegExp;
  code: EnrollmentApplicationErrorCode;
  message: string;
  retryable: boolean;
  category: EnrollmentApplicationError["category"];
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
    pattern: /^insufficient role to create enrollments$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^insufficient role to transition enrollment status$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^insufficient role to archive enrollments$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^insufficient role to restore enrollments$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^invalid initial status$/i,
    code: "INVALID_STATUS",
    message: "Select a valid initial enrollment status.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^invalid enrollment source$/i,
    code: "INVALID_SOURCE",
    message: "This enrollment source is not allowed.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^invalid source$/i,
    code: "INVALID_SOURCE",
    message: "This enrollment source is not allowed.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^customer not found$/i,
    code: "CUSTOMER_UNAVAILABLE",
    message: "Customer not found or access denied.",
    retryable: false,
    category: "not_found",
  },
  {
    pattern: /^archived customers cannot receive enrollments$/i,
    code: "CUSTOMER_NOT_ELIGIBLE",
    message: "Archived customers cannot receive enrollments.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^customer status does not allow enrollment$/i,
    code: "CUSTOMER_NOT_ELIGIBLE",
    message: "This customer status does not allow enrollment.",
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
    pattern: /^archived programs cannot receive enrollments$/i,
    code: "PROGRAM_NOT_ELIGIBLE",
    message: "Archived programs cannot receive enrollments.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^program is not active$/i,
    code: "PROGRAM_NOT_ELIGIBLE",
    message: "Only active programs can receive enrollments.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^invalid owner_member_id for organization$/i,
    code: "INVALID_OWNER",
    message: "Select a valid organization member as owner.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^open enrollment already exists for customer and program$/i,
    code: "DUPLICATE_OPEN_ENROLLMENT",
    message: "An open enrollment already exists for this customer and program.",
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
    pattern: /^enrollment not found or already archived$/i,
    code: "ENROLLMENT_UNAVAILABLE",
    message: "Enrollment not found or access denied.",
    retryable: false,
    category: "not_found",
  },
  {
    pattern: /^enrollment not found or not archived$/i,
    code: "NOT_ARCHIVED",
    message: "Enrollment not found or is not archived.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^archived enrollments cannot transition status$/i,
    code: "ARCHIVED_RECORD",
    message: "Archived enrollments cannot be changed.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^status transition is a no-op$/i,
    code: "INVALID_STATE",
    message: "This enrollment changed and must be reloaded.",
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
    pattern: /^only terminal enrollments can be archived$/i,
    code: "ARCHIVE_REQUIRES_TERMINAL",
    message: "Only completed or cancelled enrollments can be archived.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^only terminal enrollments can be restored$/i,
    code: "ARCHIVE_REQUIRES_TERMINAL",
    message: "Only completed or cancelled enrollments can be restored.",
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

function mapTransportError(error: PostgrestError | Error): EnrollmentApplicationError {
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

export function normalizeEnrollmentError(
  error: unknown,
  options: NormalizeOptions = {},
): EnrollmentApplicationError {
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
      code: "DUPLICATE_OPEN_ENROLLMENT",
      message: "An open enrollment already exists for this customer and program.",
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
): EnrollmentApplicationError {
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
): EnrollmentApplicationError {
  return invalidInputError(fieldErrors);
}

export function insufficientRoleError(): EnrollmentApplicationError {
  return {
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  };
}

export function archivedRecordError(): EnrollmentApplicationError {
  return {
    code: "ARCHIVED_RECORD",
    message: "Archived enrollments cannot be changed.",
    retryable: false,
    category: "conflict",
  };
}

export function mutationCommittedRefreshRequiredError(): EnrollmentApplicationError {
  return {
    code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
    message: "Your change was saved. Refresh to see the latest enrollment.",
    retryable: false,
    category: "server",
    refreshRequired: true,
  };
}

export function permissionDeniedError(): EnrollmentApplicationError {
  return {
    code: "PERMISSION_DENIED",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  };
}

export function orgContextMissingError(): EnrollmentApplicationError {
  return {
    code: "ORG_CONTEXT_MISSING",
    message: "Organization not found or access denied.",
    retryable: false,
    category: "not_found",
  };
}

export function authRequiredError(): EnrollmentApplicationError {
  return {
    code: "AUTH_REQUIRED",
    message: "Please sign in to continue.",
    retryable: false,
    category: "auth",
  };
}

export function enrollmentUnavailableError(): EnrollmentApplicationError {
  return {
    code: "ENROLLMENT_UNAVAILABLE",
    message: "Enrollment not found or access denied.",
    retryable: false,
    category: "not_found",
  };
}

export function mapOrganizationContextError(
  error: import("@/features/tasks/domain/types").TaskApplicationError,
): EnrollmentApplicationError {
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
      return normalizeEnrollmentError(error.message);
  }
}
