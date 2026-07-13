import type { PostgrestError } from "@supabase/supabase-js";
import type {
  TaskApplicationError,
  TaskApplicationErrorCode,
} from "@/features/tasks/domain/types";

type NormalizeOptions = {
  fallbackCode?: TaskApplicationErrorCode;
};

const MESSAGE_RULES: Array<{
  pattern: RegExp;
  code: TaskApplicationErrorCode;
  message: string;
  retryable: boolean;
  category: TaskApplicationError["category"];
}> = [
  {
    pattern: /^not authenticated$/i,
    code: "AUTH_REQUIRED",
    message: "Please sign in to continue.",
    retryable: false,
    category: "auth",
  },
  {
    pattern: /^insufficient role$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^task not found$/i,
    code: "TASK_NOT_FOUND",
    message: "Task not found or access denied.",
    retryable: false,
    category: "not_found",
  },
  {
    pattern: /^task not found or already archived$/i,
    code: "TASK_NOT_FOUND",
    message: "Task not found or access denied.",
    retryable: false,
    category: "not_found",
  },
  {
    pattern: /^task not found or not archived$/i,
    code: "TASK_NOT_FOUND",
    message: "Task not found or access denied.",
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
    pattern: /^invalid member assignment for organization$/i,
    code: "INVALID_ASSIGNEE",
    message: "Selected assignee is not valid.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^linked lead not found or archived$/i,
    code: "LINKED_ENTITY_ARCHIVED",
    message: "Linked record is invalid or unavailable.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^linked customer not found or archived$/i,
    code: "LINKED_ENTITY_ARCHIVED",
    message: "Linked record is invalid or unavailable.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^linked enrollment not found or archived$/i,
    code: "LINKED_ENTITY_ARCHIVED",
    message: "Linked record is invalid or unavailable.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^linked lead is archived$/i,
    code: "LINKED_ENTITY_ARCHIVED",
    message: "Linked record is archived.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^linked customer is archived$/i,
    code: "LINKED_ENTITY_ARCHIVED",
    message: "Linked record is archived.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^linked enrollment is archived$/i,
    code: "LINKED_ENTITY_ARCHIVED",
    message: "Linked record is archived.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^only open tasks can /i,
    code: "INVALID_STATE_TRANSITION",
    message: "This task can no longer be changed that way.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^archived tasks cannot /i,
    code: "INVALID_STATE_TRANSITION",
    message: "Archived tasks cannot be modified.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^task predecessor is immutable$/i,
    code: "PREDECESSOR_IMMUTABLE",
    message: "Task predecessor cannot be changed.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^task predecessor cycle detected$/i,
    code: "PREDECESSOR_CYCLE",
    message: "Invalid predecessor — would create a cycle.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^invalid predecessor task$/i,
    code: "INVALID_PREDECESSOR",
    message: "Selected predecessor is invalid.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^idempotency payload conflict$/i,
    code: "IDEMPOTENCY_CONFLICT",
    message: "A conflicting task already exists.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^title is required$/i,
    code: "VALIDATION_ERROR",
    message: "Please check the highlighted fields.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^due_at is required$/i,
    code: "DUE_DATE_REQUIRED",
    message: "Due date is required.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^cancel reason is required$/i,
    code: "VALIDATION_ERROR",
    message: "Cancel reason is required.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^invalid task source$/i,
    code: "VALIDATION_ERROR",
    message: "Invalid task source.",
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
      status?: number;
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

export function resolveAuthAccessError(error: unknown): TaskApplicationError {
  if (isMissingAuthSessionError(error)) {
    return authRequiredError();
  }

  return normalizeTaskError(error);
}

function mapTransportError(error: PostgrestError | Error): TaskApplicationError {
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
      code: "SESSION_EXPIRED",
      message: "Your session expired. Sign in again.",
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

export function normalizeTaskError(
  error: unknown,
  options: NormalizeOptions = {},
): TaskApplicationError {
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

  if (error && typeof error === "object" && ("code" in error || "details" in error)) {
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

export function validationErrorFromZod(
  fieldErrors: Record<string, string>,
): TaskApplicationError {
  return {
    code: "VALIDATION_ERROR",
    message: "Please check the highlighted fields.",
    retryable: false,
    category: "validation",
    fieldErrors,
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

export function permissionDeniedError(): TaskApplicationError {
  return {
    code: "PERMISSION_DENIED",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  };
}

export function orgContextMissingError(): TaskApplicationError {
  return {
    code: "ORG_CONTEXT_MISSING",
    message: "Organization not found or access denied.",
    retryable: false,
    category: "not_found",
  };
}

export function authRequiredError(): TaskApplicationError {
  return {
    code: "AUTH_REQUIRED",
    message: "Please sign in to continue.",
    retryable: false,
    category: "auth",
  };
}

export function taskNotFoundError(): TaskApplicationError {
  return {
    code: "TASK_NOT_FOUND",
    message: "Task not found or access denied.",
    retryable: false,
    category: "not_found",
  };
}

export function invalidQueryError(fieldErrors?: Record<string, string>): TaskApplicationError {
  return {
    code: "VALIDATION_ERROR",
    message: "Invalid task query.",
    retryable: false,
    category: "validation",
    fieldErrors,
  };
}
