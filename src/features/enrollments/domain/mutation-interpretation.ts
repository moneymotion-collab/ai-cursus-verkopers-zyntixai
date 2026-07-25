import type {
  EnrollmentMutationOperation,
  EnrollmentMutationResult,
  EnrollmentRefreshHints,
} from "@/features/enrollments/domain/types";

export type EnrollmentMutationUiState =
  | { kind: "success"; enrollmentId: string; refreshHints: EnrollmentRefreshHints }
  | { kind: "field_error"; fieldErrors: Record<string, string[]>; message?: string }
  | { kind: "error"; message: string; retryable: boolean }
  | {
      kind: "reload_required";
      message: string;
      enrollmentId?: string;
      committed: boolean;
      operation: EnrollmentMutationOperation;
    };

const SAFE_MESSAGES = {
  validation: "Please correct the highlighted fields and try again.",
  auth: "Please sign in to continue.",
  role: "You do not have permission to perform this action.",
  unavailable: "This enrollment is unavailable. Reload the enrollment list and try again.",
  invalidState: "This enrollment changed and must be reloaded.",
  archived: "Archived enrollments cannot be changed.",
  notArchived: "This enrollment is not archived.",
  customerUnavailable: "Select a valid customer for this organization.",
  programUnavailable: "Select a valid program for this organization.",
  customerNotEligible: "This customer is not eligible for enrollment.",
  programNotEligible: "This program is not eligible for enrollment.",
  invalidOwner: "Select a valid organization member as owner.",
  duplicateOpenEnrollment: "An open enrollment already exists for this customer and program.",
  status: "Select a valid enrollment status.",
  source: "This enrollment source is not allowed.",
  transition: "This status change is not allowed.",
  archiveRequiresTerminal: "Only completed or cancelled enrollments can be archived or restored.",
  conflict: "This enrollment could not be saved because of a conflicting change.",
  transport: "Something went wrong. Please try again.",
  unexpected: "Something went wrong. Please try again.",
} as const;

const COMMITTED_REFRESH_MESSAGES: Record<EnrollmentMutationOperation, string> = {
  create:
    "The enrollment was created, but the latest enrollment information could not be loaded. Open the enrollment before making another change.",
  update_owner_metadata:
    "The enrollment was updated, but the latest enrollment information could not be loaded. Reload the enrollment before making another change.",
  transition_status:
    "The enrollment status was updated, but the latest enrollment information could not be loaded. Reload the enrollment before making another change.",
  archive:
    "The enrollment was archived, but the latest enrollment information could not be loaded. Reload the enrollment before making another change.",
  restore:
    "The enrollment was restored, but the latest enrollment information could not be loaded. Reload the enrollment before making another change.",
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

export function interpretEnrollmentMutationResult(
  result: EnrollmentMutationResult,
): EnrollmentMutationUiState {
  if (result.ok) {
    return {
      kind: "success",
      enrollmentId: result.enrollmentId,
      refreshHints: result.refreshHints,
    };
  }

  if (result.committed) {
    return {
      kind: "reload_required",
      message: COMMITTED_REFRESH_MESSAGES[result.operation],
      enrollmentId: result.enrollmentId,
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
    case "CUSTOMER_UNAVAILABLE":
      return {
        kind: "field_error",
        fieldErrors: { customerId: [SAFE_MESSAGES.customerUnavailable] },
        message: SAFE_MESSAGES.customerUnavailable,
      };
    case "PROGRAM_UNAVAILABLE":
      return {
        kind: "field_error",
        fieldErrors: { programId: [SAFE_MESSAGES.programUnavailable] },
        message: SAFE_MESSAGES.programUnavailable,
      };
    case "CUSTOMER_NOT_ELIGIBLE":
      return {
        kind: "field_error",
        fieldErrors: { customerId: [SAFE_MESSAGES.customerNotEligible] },
        message: SAFE_MESSAGES.customerNotEligible,
      };
    case "PROGRAM_NOT_ELIGIBLE":
      return {
        kind: "field_error",
        fieldErrors: { programId: [SAFE_MESSAGES.programNotEligible] },
        message: SAFE_MESSAGES.programNotEligible,
      };
    case "INVALID_OWNER":
      return {
        kind: "field_error",
        fieldErrors: { ownerMemberId: [SAFE_MESSAGES.invalidOwner] },
        message: SAFE_MESSAGES.invalidOwner,
      };
    case "DUPLICATE_OPEN_ENROLLMENT":
      return {
        kind: "field_error",
        fieldErrors: { programId: [SAFE_MESSAGES.duplicateOpenEnrollment] },
        message: SAFE_MESSAGES.duplicateOpenEnrollment,
      };
    case "INVALID_STATUS":
      return {
        kind: "field_error",
        fieldErrors: { initialStatus: [SAFE_MESSAGES.status] },
        message: SAFE_MESSAGES.status,
      };
    case "INVALID_SOURCE":
      return { kind: "error", message: SAFE_MESSAGES.source, retryable: false };
    case "TRANSITION_NOT_ALLOWED":
      return {
        kind: "field_error",
        fieldErrors: { toStatus: [SAFE_MESSAGES.transition] },
        message: SAFE_MESSAGES.transition,
      };
    case "AUTH_REQUIRED":
      return { kind: "error", message: SAFE_MESSAGES.auth, retryable: false };
    case "ORG_CONTEXT_MISSING":
      return { kind: "error", message: SAFE_MESSAGES.unavailable, retryable: false };
    case "INSUFFICIENT_ROLE":
    case "PERMISSION_DENIED":
      return { kind: "error", message: SAFE_MESSAGES.role, retryable: false };
    case "ENROLLMENT_UNAVAILABLE":
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
    case "NOT_ARCHIVED":
      return { kind: "error", message: SAFE_MESSAGES.notArchived, retryable: false };
    case "ARCHIVE_REQUIRES_TERMINAL":
      return { kind: "error", message: SAFE_MESSAGES.archiveRequiresTerminal, retryable: false };
    case "CONFLICT":
      return { kind: "error", message: SAFE_MESSAGES.conflict, retryable: false };
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

export function enrollmentMutationFormIsLocked(state: EnrollmentMutationUiState): boolean {
  return state.kind === "reload_required" && state.committed;
}
