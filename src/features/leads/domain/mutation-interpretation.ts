import type {
  LeadMutationOperation,
  LeadMutationResult,
  LeadRefreshHints,
} from "@/features/leads/domain/types";

export type LeadMutationUiState =
  | { kind: "success"; leadId: string; customerId?: string; refreshHints: LeadRefreshHints }
  | { kind: "field_error"; fieldErrors: Record<string, string[]>; message?: string }
  | { kind: "error"; message: string; retryable: boolean }
  | {
      kind: "reload_required";
      message: string;
      leadId?: string;
      customerId?: string;
      committed: boolean;
      operation: LeadMutationOperation;
    };

const SAFE_MESSAGES = {
  validation: "Please correct the highlighted fields and try again.",
  auth: "Please sign in to continue.",
  role: "You do not have permission to perform this action.",
  unavailable: "This lead is unavailable. Reload the lead list and try again.",
  invalidState: "This lead changed and must be reloaded.",
  archived: "Archived leads cannot be changed.",
  alreadyConverted: "This lead has already been converted.",
  existingCustomerMatch:
    "A matching customer already exists. Select the existing customer to continue conversion.",
  owner: "Select a valid owner for this organization.",
  stage: "Select a valid pipeline stage.",
  transition: "This status change is not allowed.",
  transport: "Something went wrong. Please try again.",
  unexpected: "Something went wrong. Please try again.",
} as const;

const COMMITTED_REFRESH_MESSAGES: Record<LeadMutationOperation, string> = {
  create:
    "The lead was created, but the latest lead information could not be loaded. Reload the lead before making another change.",
  update_profile:
    "The lead was updated, but the latest lead information could not be loaded. Reload the lead before making another change.",
  transition_stage:
    "The lead stage was updated, but the latest lead information could not be loaded. Reload the lead before making another change.",
  transition_status:
    "The lead status was updated, but the latest lead information could not be loaded. Reload the lead before making another change.",
  convert:
    "The lead was converted, but the latest lead information could not be loaded. Reload the lead before making another change.",
  archive:
    "The lead was archived, but the latest lead information could not be loaded. Reload the lead before making another change.",
  restore:
    "The lead was restored, but the latest lead information could not be loaded. Reload the lead before making another change.",
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

export function interpretLeadMutationResult(result: LeadMutationResult): LeadMutationUiState {
  if (result.ok) {
    return {
      kind: "success",
      leadId: result.leadId,
      customerId: result.customerId,
      refreshHints: result.refreshHints,
    };
  }

  if (result.committed) {
    return {
      kind: "reload_required",
      message: COMMITTED_REFRESH_MESSAGES[result.operation],
      leadId: result.leadId,
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
    case "LEAD_UNAVAILABLE":
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
    case "ALREADY_CONVERTED":
      return { kind: "error", message: SAFE_MESSAGES.alreadyConverted, retryable: false };
    case "EXISTING_CUSTOMER_MATCH_REQUIRED":
      return {
        kind: "field_error",
        fieldErrors: { existingCustomerId: [SAFE_MESSAGES.existingCustomerMatch] },
        message: SAFE_MESSAGES.existingCustomerMatch,
      };
    case "INVALID_OWNER":
      return {
        kind: "field_error",
        fieldErrors: { ownerMemberId: [SAFE_MESSAGES.owner] },
        message: SAFE_MESSAGES.owner,
      };
    case "INVALID_STAGE":
      return {
        kind: "field_error",
        fieldErrors: { toStageId: [SAFE_MESSAGES.stage] },
        message: SAFE_MESSAGES.stage,
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

export function leadMutationFormIsLocked(state: LeadMutationUiState): boolean {
  return state.kind === "reload_required" && state.committed;
}
