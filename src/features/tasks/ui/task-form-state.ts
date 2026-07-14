import type { TaskMutationResult } from "@/features/tasks/domain/types";

export type TaskFormUiState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "field_error"; fieldErrors: Record<string, string[]>; message?: string }
  | { kind: "error"; message: string; retryable: boolean }
  | { kind: "reload_required"; message: string; taskId?: string; committed: boolean }
  | { kind: "success"; taskId: string; refreshLists: boolean; refreshHistory: boolean };

export type LifecycleOperation = "complete" | "cancel" | "archive" | "restore";

const SAFE_MESSAGES = {
  validation: "Please correct the highlighted fields and try again.",
  auth: "Please sign in to continue.",
  role: "You do not have permission to perform this action.",
  unavailable: "This task is unavailable. Reload the task list and try again.",
  invalidState: "This task changed and must be reloaded.",
  invalidAssignee: "Select a valid team member for this organization.",
  linkedUnavailable: "The selected linked record is unavailable.",
  restoreLinkedUnavailable:
    "This task cannot be restored because a linked record is no longer available.",
  transport: "Something went wrong. Please try again.",
  unexpected: "Something went wrong. Please try again.",
  committedRefresh:
    "The task was saved, but the latest task information could not be loaded. Reload the task before making another change.",
} as const;

const LIFECYCLE_COMMITTED_REFRESH_MESSAGES: Record<LifecycleOperation, string> = {
  complete:
    "The task was completed, but the latest task information could not be loaded. Reload the task before making another change.",
  cancel:
    "The task was cancelled, but the latest task information could not be loaded. Reload the task before making another change.",
  archive:
    "The task was archived, but the latest task information could not be loaded. Reload the task before making another change.",
  restore:
    "The task was restored from the archive, but the latest task information could not be loaded. Reload the task before making another change.",
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

export type InterpretTaskMutationOptions = {
  lifecycleOperation?: LifecycleOperation;
};

export function interpretTaskMutationResult(
  result: TaskMutationResult,
  options?: InterpretTaskMutationOptions,
): TaskFormUiState {
  if (result.ok) {
    return {
      kind: "success",
      taskId: result.taskId,
      refreshLists: result.refreshHints.taskLists,
      refreshHistory: result.refreshHints.taskHistory,
    };
  }

  if (result.committed) {
    const message =
      options?.lifecycleOperation !== undefined
        ? LIFECYCLE_COMMITTED_REFRESH_MESSAGES[options.lifecycleOperation]
        : SAFE_MESSAGES.committedRefresh;
    return {
      kind: "reload_required",
      message,
      taskId: result.taskId,
      committed: true,
    };
  }

  const { error } = result;

  switch (error.code) {
    case "VALIDATION_ERROR":
    case "MALFORMED_INPUT":
      return {
        kind: "field_error",
        fieldErrors: normalizeFieldErrors(error.fieldErrors),
        message: SAFE_MESSAGES.validation,
      };
    case "AUTH_REQUIRED":
    case "SESSION_EXPIRED":
      return { kind: "error", message: SAFE_MESSAGES.auth, retryable: false };
    case "INSUFFICIENT_ROLE":
    case "PERMISSION_DENIED":
      return { kind: "error", message: SAFE_MESSAGES.role, retryable: false };
    case "TASK_NOT_FOUND":
      return { kind: "error", message: SAFE_MESSAGES.unavailable, retryable: false };
    case "INVALID_STATE_TRANSITION":
    case "TASK_ALREADY_TERMINAL":
      return {
        kind: "reload_required",
        message: SAFE_MESSAGES.invalidState,
        committed: false,
      };
    case "INVALID_ASSIGNEE":
      return {
        kind: "field_error",
        fieldErrors: { assigneeMemberId: [SAFE_MESSAGES.invalidAssignee] },
        message: SAFE_MESSAGES.invalidAssignee,
      };
    case "INVALID_LINKED_CONTEXT":
    case "CONFLICTING_LINKED_CONTEXT":
      return {
        kind: "field_error",
        fieldErrors: { linkedContext: [SAFE_MESSAGES.linkedUnavailable] },
        message: SAFE_MESSAGES.linkedUnavailable,
      };
    case "LINKED_ENTITY_ARCHIVED":
      if (options?.lifecycleOperation === "restore") {
        return {
          kind: "error",
          message: SAFE_MESSAGES.restoreLinkedUnavailable,
          retryable: false,
        };
      }
      return {
        kind: "field_error",
        fieldErrors: { linkedContext: [SAFE_MESSAGES.linkedUnavailable] },
        message: SAFE_MESSAGES.linkedUnavailable,
      };
    case "UNEXPECTED_ERROR":
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
        };
      }
      return {
        kind: "error",
        message: SAFE_MESSAGES.unexpected,
        retryable: error.retryable === true,
      };
  }
}

export function fieldErrorMessage(
  fieldErrors: Record<string, string[]> | undefined,
  field: string,
): string | undefined {
  return fieldErrors?.[field]?.[0];
}

export function formIsLocked(state: TaskFormUiState): boolean {
  return state.kind === "pending" || (state.kind === "reload_required" && state.committed);
}
