import type {
  AttentionLifecycleAction,
  AttentionLifecycleMutationResult,
} from "@/features/attention/domain/lifecycle-action-types";
import type { AttentionApplicationError } from "@/features/attention/domain/types";

/**
 * Presentation contract for later lifecycle forms (B1.7.6-B+).
 * B1.7.6-A defines mapping only — no product controls render from this.
 */
export type AttentionLifecycleActionUiState =
  | { kind: "idle" }
  | { kind: "pending"; action: AttentionLifecycleAction }
  | {
      kind: "success";
      action: AttentionLifecycleAction;
      attentionItemId: string;
      outcome: "applied";
      returnPath: string;
    }
  | {
      kind: "noop_success";
      action: AttentionLifecycleAction;
      attentionItemId: string;
      returnPath: string;
    }
  | {
      kind: "field_error";
      fieldErrors: Record<string, string[]>;
      message: string;
    }
  | {
      kind: "error";
      message: string;
      retryable: boolean;
    }
  | {
      kind: "auth_required";
      message: string;
    }
  | {
      kind: "organization_required";
      message: string;
    }
  | {
      kind: "unavailable";
      message: string;
    }
  | {
      kind: "permission_denied";
      message: string;
    }
  | {
      kind: "conflict";
      message: string;
      refreshRequired: true;
    };

const SAFE_MESSAGES = {
  validation: "Please correct the highlighted fields and try again.",
  auth: "Please sign in to continue.",
  organization: "Organization not found or access denied.",
  permission: "You don't have permission for this action.",
  unavailable: "Attention item not found or access denied.",
  conflict:
    "This attention item changed. Refresh the detail page and try again.",
  invalidAssignment: "Select a valid organization member.",
  unexpected: "Something went wrong. Please try again.",
} as const;

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

export function createIdleAttentionLifecycleActionState(): AttentionLifecycleActionUiState {
  return { kind: "idle" };
}

export function createPendingAttentionLifecycleActionState(
  action: AttentionLifecycleAction,
): AttentionLifecycleActionUiState {
  return { kind: "pending", action };
}

export function shouldDisableAttentionLifecycleSubmit(
  state: AttentionLifecycleActionUiState,
): boolean {
  return state.kind === "pending";
}

export function getAttentionLifecyclePendingLabel(
  state: AttentionLifecycleActionUiState,
): string | null {
  if (state.kind !== "pending") {
    return null;
  }

  switch (state.action) {
    case "acknowledge":
      return "Acknowledging…";
    case "assign":
      return "Assigning…";
    case "unassign":
      return "Unassigning…";
    case "update_severity":
      return "Updating severity…";
    case "resolve":
      return "Resolving…";
    case "dismiss":
      return "Dismissing…";
    case "archive":
      return "Archiving…";
    default:
      return "Working…";
  }
}

export function interpretAttentionLifecycleMutationResult(
  result: AttentionLifecycleMutationResult,
): AttentionLifecycleActionUiState {
  if (result.ok) {
    if (result.outcome === "noop") {
      return {
        kind: "noop_success",
        action: result.action,
        attentionItemId: result.attentionItemId,
        returnPath: result.returnPath,
      };
    }

    return {
      kind: "success",
      action: result.action,
      attentionItemId: result.attentionItemId,
      outcome: "applied",
      returnPath: result.returnPath,
    };
  }

  return mapAttentionLifecycleFailure(result.error);
}

function mapAttentionLifecycleFailure(
  error: AttentionApplicationError,
): AttentionLifecycleActionUiState {
  switch (error.code) {
    case "INVALID_INPUT": {
      const fieldErrors = normalizeFieldErrors(error.fieldErrors);
      if (
        fieldErrors.assigneeMemberId ||
        /organization member/i.test(error.message)
      ) {
        return {
          kind: "field_error",
          fieldErrors: {
            assigneeMemberId: [
              fieldErrors.assigneeMemberId?.[0] ?? SAFE_MESSAGES.invalidAssignment,
            ],
            ...fieldErrors,
          },
          message: SAFE_MESSAGES.invalidAssignment,
        };
      }
      return {
        kind: "field_error",
        fieldErrors,
        message: error.message || SAFE_MESSAGES.validation,
      };
    }
    case "AUTH_REQUIRED":
      return { kind: "auth_required", message: SAFE_MESSAGES.auth };
    case "ORG_CONTEXT_MISSING":
      return {
        kind: "organization_required",
        message: SAFE_MESSAGES.organization,
      };
    case "ATTENTION_ITEM_UNAVAILABLE":
    case "ENROLLMENT_UNAVAILABLE":
      return { kind: "unavailable", message: SAFE_MESSAGES.unavailable };
    case "PERMISSION_DENIED":
    case "INSUFFICIENT_ROLE":
      return { kind: "permission_denied", message: SAFE_MESSAGES.permission };
    case "INVALID_STATE":
    case "CONFLICT":
      return {
        kind: "conflict",
        message: error.message || SAFE_MESSAGES.conflict,
        refreshRequired: true,
      };
    default:
      if (error.refreshRequired) {
        return {
          kind: "conflict",
          message: SAFE_MESSAGES.conflict,
          refreshRequired: true,
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

/** Ensures presentation never surfaces raw RPC/SQL payloads. */
export function attentionLifecycleActionStateExposesRawErrors(
  state: AttentionLifecycleActionUiState,
): boolean {
  if (state.kind === "error" || state.kind === "conflict") {
    const message = state.message.toLowerCase();
    return (
      message.includes("rpc") ||
      message.includes("sql") ||
      message.includes("postgres") ||
      message.includes("attention_items") ||
      message.includes("stack")
    );
  }
  return false;
}
