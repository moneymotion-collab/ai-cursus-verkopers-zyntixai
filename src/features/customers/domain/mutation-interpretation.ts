import type {
  CustomerMutationOperation,
  CustomerMutationResult,
  CustomerRefreshHints,
} from "@/features/customers/domain/types";

export type CustomerMutationUiState =
  | { kind: "success"; customerId: string; refreshHints: CustomerRefreshHints }
  | { kind: "field_error"; fieldErrors: Record<string, string[]>; message?: string }
  | { kind: "error"; message: string; retryable: boolean }
  | {
      kind: "reload_required";
      message: string;
      customerId?: string;
      committed: boolean;
      operation: CustomerMutationOperation;
    };

const SAFE_MESSAGES = {
  validation: "Please correct the highlighted fields and try again.",
  auth: "Please sign in to continue.",
  role: "You do not have permission to perform this action.",
  unavailable: "This customer is unavailable. Reload the customer list and try again.",
  invalidState: "This customer changed and must be reloaded.",
  archived: "Archived customers cannot be changed.",
  duplicate: "A customer with this email already exists in your organization.",
  owner: "Select a valid owner for this organization.",
  transition: "This status change is not allowed.",
  transport: "Something went wrong. Please try again.",
  unexpected: "Something went wrong. Please try again.",
  committedRefresh:
    "The customer was saved, but the latest customer information could not be loaded. Reload the customer before making another change.",
} as const;

const COMMITTED_REFRESH_MESSAGES: Record<CustomerMutationOperation, string> = {
  create:
    "The customer was created, but the latest customer information could not be loaded. Reload the customer before making another change.",
  update_profile:
    "The customer was updated, but the latest customer information could not be loaded. Reload the customer before making another change.",
  transition_status:
    "The customer status was updated, but the latest customer information could not be loaded. Reload the customer before making another change.",
  archive:
    "The customer was archived, but the latest customer information could not be loaded. Reload the customer before making another change.",
  restore:
    "The customer was restored, but the latest customer information could not be loaded. Reload the customer before making another change.",
};

function normalizeFieldErrors(
  fieldErrors: Record<string, string> | undefined,
): Record<string, string[]> {
  if (!fieldErrors) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(fieldErrors).map(([key, value]) => [key, [value]]),
  );
}

export function interpretCustomerMutationResult(
  result: CustomerMutationResult,
): CustomerMutationUiState {
  if (result.ok) {
    return {
      kind: "success",
      customerId: result.customerId,
      refreshHints: result.refreshHints,
    };
  }

  if (result.committed) {
    return {
      kind: "reload_required",
      message: COMMITTED_REFRESH_MESSAGES[result.operation],
      customerId: result.customerId,
      committed: true,
      operation: result.operation,
    };
  }

  const { error, operation } = result;

  switch (error.code) {
    case "INVALID_INPUT":
      return {
        kind: "field_error",
        fieldErrors: normalizeFieldErrors(error.fieldErrors),
        message: SAFE_MESSAGES.validation,
      };
    case "AUTH_REQUIRED":
      return { kind: "error", message: SAFE_MESSAGES.auth, retryable: false };
    case "INSUFFICIENT_ROLE":
    case "PERMISSION_DENIED":
      return { kind: "error", message: SAFE_MESSAGES.role, retryable: false };
    case "CUSTOMER_UNAVAILABLE":
      return { kind: "error", message: SAFE_MESSAGES.unavailable, retryable: false };
    case "INVALID_STATE":
      return {
        kind: "reload_required",
        message: SAFE_MESSAGES.invalidState,
        committed: false,
        operation,
      };
    case "ARCHIVED_RECORD":
      return { kind: "error", message: SAFE_MESSAGES.archived, retryable: false };
    case "DUPLICATE_CUSTOMER":
      return {
        kind: "field_error",
        fieldErrors: { email: [SAFE_MESSAGES.duplicate] },
        message: SAFE_MESSAGES.duplicate,
      };
    case "INVALID_OWNER":
      return {
        kind: "field_error",
        fieldErrors: { ownerMemberId: [SAFE_MESSAGES.owner] },
        message: SAFE_MESSAGES.owner,
      };
    case "TRANSITION_NOT_ALLOWED":
      return {
        kind: "field_error",
        fieldErrors: { toStatus: [SAFE_MESSAGES.transition] },
        message: SAFE_MESSAGES.transition,
      };
    case "UNEXPECTED_ERROR":
    case "NETWORK_ERROR":
    case "TIMEOUT":
    case "RATE_LIMITED":
    case "DATABASE_UNAVAILABLE":
      return {
        kind: "error",
        message: SAFE_MESSAGES.transport,
        retryable: error.retryable === true,
      };
    default:
      if (error.refreshRequired) {
        return {
          kind: "reload_required",
          message: SAFE_MESSAGES.invalidState,
          committed: false,
          operation,
        };
      }
      return {
        kind: "error",
        message: SAFE_MESSAGES.unexpected,
        retryable: error.retryable === true,
      };
  }
}

export function customerMutationFormIsLocked(state: CustomerMutationUiState): boolean {
  return state.kind === "reload_required" && state.committed;
}
