import type {
  ProgressMutationOperation,
  ProgressMutationResult,
  ProgressRefreshHints,
} from "@/features/progress/domain/types";

export type ProgressMutationUiState =
  | { kind: "success"; progressFactId: string; refreshHints: ProgressRefreshHints }
  | { kind: "field_error"; fieldErrors: Record<string, string[]>; message?: string }
  | { kind: "error"; message: string; retryable: boolean }
  | {
      kind: "reload_required";
      message: string;
      progressFactId?: string;
      committed: boolean;
      operation: ProgressMutationOperation;
    };

const SAFE_MESSAGES = {
  validation: "Please correct the highlighted fields and try again.",
  auth: "Please sign in to continue.",
  role: "You don't have permission to perform this action.",
  unavailable:
    "This progress record is unavailable. Reload the progress list and try again.",
  invalidState: "This progress record changed and must be reloaded.",
  enrollmentUnavailable: "Select a valid enrollment for this organization.",
  factType: "Select a valid progress fact type.",
  payload: "Provide a valid progress payload.",
  idempotencyConflict: "This progress submission was already processed.",
  correctionNotAllowed: "This progress fact cannot be corrected.",
  alreadyVoided: "This progress fact is already voided.",
  statusBlocksProgress: "This enrollment status does not allow progress changes.",
  archived: "Archived progress facts cannot be changed.",
  conflict: "This progress record could not be saved because of a conflicting change.",
  transport: "Something went wrong. Please try again.",
  unexpected: "Something went wrong. Please try again.",
} as const;

const COMMITTED_REFRESH_MESSAGES: Record<ProgressMutationOperation, string> = {
  record:
    "The progress record was saved, but the latest information could not be loaded. Open the record before making another change.",
  correct:
    "The correction was saved, but the latest information could not be loaded. Reload the record before making another change.",
  void:
    "The progress record was voided, but the latest information could not be loaded. Reload the record before making another change.",
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

export function interpretProgressMutationResult(
  result: ProgressMutationResult,
): ProgressMutationUiState {
  if (result.ok) {
    return {
      kind: "success",
      progressFactId: result.progressFactId,
      refreshHints: result.refreshHints,
    };
  }

  if (result.committed) {
    return {
      kind: "reload_required",
      message: COMMITTED_REFRESH_MESSAGES[result.operation],
      progressFactId: result.progressFactId,
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
    case "INVALID_FACT_TYPE":
      return {
        kind: "field_error",
        fieldErrors: { factType: [SAFE_MESSAGES.factType] },
        message: SAFE_MESSAGES.factType,
      };
    case "INVALID_PAYLOAD":
      return {
        kind: "field_error",
        fieldErrors: { form: [SAFE_MESSAGES.payload] },
        message: SAFE_MESSAGES.payload,
      };
    case "IDEMPOTENCY_CONFLICT":
      return {
        kind: "field_error",
        fieldErrors: { idempotencyKey: [SAFE_MESSAGES.idempotencyConflict] },
        message: SAFE_MESSAGES.idempotencyConflict,
      };
    case "ENROLLMENT_UNAVAILABLE":
      return {
        kind: "field_error",
        fieldErrors: { enrollmentId: [SAFE_MESSAGES.enrollmentUnavailable] },
        message: SAFE_MESSAGES.enrollmentUnavailable,
      };
    case "AUTH_REQUIRED":
      return { kind: "error", message: SAFE_MESSAGES.auth, retryable: false };
    case "ORG_CONTEXT_MISSING":
      return { kind: "error", message: SAFE_MESSAGES.unavailable, retryable: false };
    case "INSUFFICIENT_ROLE":
    case "PERMISSION_DENIED":
      return { kind: "error", message: SAFE_MESSAGES.role, retryable: false };
    case "PROGRESS_FACT_UNAVAILABLE":
      return { kind: "error", message: SAFE_MESSAGES.unavailable, retryable: false };
    case "INVALID_STATE":
      return {
        kind: "reload_required",
        message: SAFE_MESSAGES.invalidState,
        committed: false,
        operation,
      };
    case "CORRECTION_NOT_ALLOWED":
      return { kind: "error", message: SAFE_MESSAGES.correctionNotAllowed, retryable: false };
    case "ALREADY_VOIDED":
      return { kind: "error", message: SAFE_MESSAGES.alreadyVoided, retryable: false };
    case "ENROLLMENT_STATUS_BLOCKS_PROGRESS":
      return { kind: "error", message: SAFE_MESSAGES.statusBlocksProgress, retryable: false };
    case "ARCHIVED_RECORD":
      return { kind: "error", message: SAFE_MESSAGES.archived, retryable: false };
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

export function progressMutationFormIsLocked(state: ProgressMutationUiState): boolean {
  return state.kind === "reload_required" && state.committed;
}
