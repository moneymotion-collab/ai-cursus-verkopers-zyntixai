import type {
  ProgramMutationOperation,
  ProgramMutationResult,
  ProgramRefreshHints,
} from "@/features/programs/domain/types";

export type ProgramMutationUiState =
  | { kind: "success"; programId: string; refreshHints: ProgramRefreshHints }
  | { kind: "field_error"; fieldErrors: Record<string, string[]>; message?: string }
  | { kind: "error"; message: string; retryable: boolean }
  | {
      kind: "reload_required";
      message: string;
      programId?: string;
      committed: boolean;
      operation: ProgramMutationOperation;
    };

const SAFE_MESSAGES = {
  validation: "Please correct the highlighted fields and try again.",
  auth: "Please sign in to continue.",
  role: "You do not have permission to perform this action.",
  unavailable: "This program is unavailable. Reload the program list and try again.",
  invalidState: "This program changed and must be reloaded.",
  archived: "Archived programs cannot be changed.",
  duplicate: "A program with this name already exists in your organization.",
  deliveryMode: "Select a valid delivery mode.",
  status: "Select a valid program status.",
  transition: "This status change is not allowed.",
  archiveBlocked: "This program cannot be archived while open enrollments exist.",
  notArchived: "This program is not archived.",
  transport: "Something went wrong. Please try again.",
  unexpected: "Something went wrong. Please try again.",
} as const;

const COMMITTED_REFRESH_MESSAGES: Record<ProgramMutationOperation, string> = {
  create:
    "The program was created, but the latest program information could not be loaded. Open the program before making another change.",
  update:
    "The program was updated, but the latest program information could not be loaded. Reload the program before making another change.",
  transition_status:
    "The program status was updated, but the latest program information could not be loaded. Reload the program before making another change.",
  archive:
    "The program was archived, but the latest program information could not be loaded. Reload the program before making another change.",
  restore:
    "The program was restored, but the latest program information could not be loaded. Reload the program before making another change.",
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

export function interpretProgramMutationResult(
  result: ProgramMutationResult,
): ProgramMutationUiState {
  if (result.ok) {
    return {
      kind: "success",
      programId: result.programId,
      refreshHints: result.refreshHints,
    };
  }

  if (result.committed) {
    return {
      kind: "reload_required",
      message: COMMITTED_REFRESH_MESSAGES[result.operation],
      programId: result.programId,
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
    case "INVALID_DELIVERY_MODE":
      return {
        kind: "field_error",
        fieldErrors: { deliveryMode: [SAFE_MESSAGES.deliveryMode] },
        message: SAFE_MESSAGES.deliveryMode,
      };
    case "INVALID_STATUS":
      return {
        kind: "field_error",
        fieldErrors: { toStatus: [SAFE_MESSAGES.status] },
        message: SAFE_MESSAGES.status,
      };
    case "AUTH_REQUIRED":
      return { kind: "error", message: SAFE_MESSAGES.auth, retryable: false };
    case "INSUFFICIENT_ROLE":
    case "PERMISSION_DENIED":
      return { kind: "error", message: SAFE_MESSAGES.role, retryable: false };
    case "PROGRAM_UNAVAILABLE":
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
    case "DUPLICATE_PROGRAM":
      return {
        kind: "field_error",
        fieldErrors: { name: [SAFE_MESSAGES.duplicate] },
        message: SAFE_MESSAGES.duplicate,
      };
    case "TRANSITION_NOT_ALLOWED":
      return {
        kind: "field_error",
        fieldErrors: { toStatus: [SAFE_MESSAGES.transition] },
        message: SAFE_MESSAGES.transition,
      };
    case "ARCHIVE_BLOCKED_OPEN_ENROLLMENTS":
      return { kind: "error", message: SAFE_MESSAGES.archiveBlocked, retryable: false };
    case "NOT_ARCHIVED":
      return { kind: "error", message: SAFE_MESSAGES.notArchived, retryable: false };
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

export function programMutationFormIsLocked(state: ProgramMutationUiState): boolean {
  return state.kind === "reload_required" && state.committed;
}
