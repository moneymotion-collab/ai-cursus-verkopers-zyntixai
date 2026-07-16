import type { PostgrestError } from "@supabase/supabase-js";
import type {
  LeadApplicationError,
  LeadApplicationErrorCode,
} from "@/features/leads/domain/types";

type NormalizeOptions = {
  fallbackCode?: LeadApplicationErrorCode;
};

const MESSAGE_RULES: Array<{
  pattern: RegExp;
  code: LeadApplicationErrorCode;
  message: string;
  retryable: boolean;
  category: LeadApplicationError["category"];
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
    pattern: /^insufficient role to create leads$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^insufficient role to transition lead stage$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^insufficient role to transition lead status$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^insufficient role to convert leads$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^insufficient role to archive leads$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^insufficient role to restore leads$/i,
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
  {
    pattern: /^invalid owner_member_id for organization$/i,
    code: "INVALID_OWNER",
    message: "Selected owner is not valid for this organization.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^display_name is required$/i,
    code: "INVALID_INPUT",
    message: "Please check the highlighted fields.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^source_type is required$/i,
    code: "INVALID_INPUT",
    message: "Please check the highlighted fields.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^lead not found$/i,
    code: "LEAD_UNAVAILABLE",
    message: "Lead not found or access denied.",
    retryable: false,
    category: "not_found",
  },
  {
    pattern: /^lead not found or already archived$/i,
    code: "LEAD_UNAVAILABLE",
    message: "Lead not found or access denied.",
    retryable: false,
    category: "not_found",
  },
  {
    pattern: /^lead not found or not archived$/i,
    code: "LEAD_UNAVAILABLE",
    message: "Lead not found or access denied.",
    retryable: false,
    category: "not_found",
  },
  {
    pattern: /^archived leads cannot transition stage$/i,
    code: "ARCHIVED_RECORD",
    message: "Archived leads cannot be changed.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^archived leads cannot transition status$/i,
    code: "ARCHIVED_RECORD",
    message: "Archived leads cannot be changed.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^archived leads cannot be converted$/i,
    code: "ARCHIVED_RECORD",
    message: "Archived leads cannot be changed.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^only open leads can transition stage$/i,
    code: "TRANSITION_NOT_ALLOWED",
    message: "This stage change is not allowed.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^only open leads can be converted$/i,
    code: "TRANSITION_NOT_ALLOWED",
    message: "Only open leads can be converted.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^converted leads cannot transition status$/i,
    code: "ALREADY_CONVERTED",
    message: "Converted leads cannot change status.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^lead already converted$/i,
    code: "ALREADY_CONVERTED",
    message: "This lead has already been converted.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^stage transition is a no-op$/i,
    code: "INVALID_STATE",
    message: "This lead changed and must be reloaded.",
    retryable: false,
    category: "conflict",
  },
  {
    pattern: /^status transition is a no-op$/i,
    code: "INVALID_STATE",
    message: "This lead changed and must be reloaded.",
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
    pattern: /^target stage not found or archived$/i,
    code: "INVALID_STAGE",
    message: "Select a valid pipeline stage.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^default pipeline stage not found$/i,
    code: "INVALID_STAGE",
    message: "A default pipeline stage is required before creating leads.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^pipeline invariant violated/i,
    code: "INVALID_STAGE",
    message: "A default pipeline stage is required before creating leads.",
    retryable: false,
    category: "validation",
  },
  {
    pattern: /^customer not found in organization$/i,
    code: "LEAD_UNAVAILABLE",
    message: "Customer not found or access denied.",
    retryable: false,
    category: "not_found",
  },
  {
    pattern: /^existing_customer_match_requires_explicit_selection$/i,
    code: "EXISTING_CUSTOMER_MATCH_REQUIRED",
    message:
      "A matching customer already exists. Select the existing customer to continue conversion.",
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

function mapTransportError(error: PostgrestError | Error): LeadApplicationError {
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

export function normalizeLeadError(
  error: unknown,
  options: NormalizeOptions = {},
): LeadApplicationError {
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

export function invalidInputError(fieldErrors?: Record<string, string>): LeadApplicationError {
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
): LeadApplicationError {
  return invalidInputError(fieldErrors);
}

export function insufficientRoleError(): LeadApplicationError {
  return {
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  };
}

export function archivedRecordError(): LeadApplicationError {
  return {
    code: "ARCHIVED_RECORD",
    message: "Archived leads cannot be changed.",
    retryable: false,
    category: "conflict",
  };
}

export function invalidOwnerError(): LeadApplicationError {
  return {
    code: "INVALID_OWNER",
    message: "Selected owner is not valid for this organization.",
    retryable: false,
    category: "validation",
  };
}

export function invalidStageError(): LeadApplicationError {
  return {
    code: "INVALID_STAGE",
    message: "Select a valid pipeline stage.",
    retryable: false,
    category: "validation",
  };
}

export function alreadyConvertedError(): LeadApplicationError {
  return {
    code: "ALREADY_CONVERTED",
    message: "This lead has already been converted.",
    retryable: false,
    category: "conflict",
  };
}

export function transitionNotAllowedError(): LeadApplicationError {
  return {
    code: "TRANSITION_NOT_ALLOWED",
    message: "This status change is not allowed.",
    retryable: false,
    category: "validation",
  };
}

export function mutationCommittedRefreshRequiredError(): LeadApplicationError {
  return {
    code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
    message: "Your change was saved. Refresh to see the latest lead.",
    retryable: false,
    category: "server",
    refreshRequired: true,
  };
}

export function permissionDeniedError(): LeadApplicationError {
  return {
    code: "PERMISSION_DENIED",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  };
}

export function orgContextMissingError(): LeadApplicationError {
  return {
    code: "ORG_CONTEXT_MISSING",
    message: "Organization not found or access denied.",
    retryable: false,
    category: "not_found",
  };
}

export function authRequiredError(): LeadApplicationError {
  return {
    code: "AUTH_REQUIRED",
    message: "Please sign in to continue.",
    retryable: false,
    category: "auth",
  };
}

export function leadUnavailableError(): LeadApplicationError {
  return {
    code: "LEAD_UNAVAILABLE",
    message: "Lead not found or access denied.",
    retryable: false,
    category: "not_found",
  };
}

export function mapOrganizationContextError(
  error: import("@/features/tasks/domain/types").TaskApplicationError,
): LeadApplicationError {
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
      return normalizeLeadError(error.message);
  }
}

export function mapTaskReadError(
  error: import("@/features/tasks/domain/types").TaskApplicationError,
): LeadApplicationError {
  return mapOrganizationContextError(error);
}
