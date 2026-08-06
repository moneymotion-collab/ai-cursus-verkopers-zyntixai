import type { AttentionApplicationError } from "@/features/attention/domain/types";

/**
 * B1.7.6-A lifecycle action identifiers.
 * Close / reopen / restore / snooze / priority are intentionally absent.
 */
export const ATTENTION_LIFECYCLE_ACTIONS = [
  "acknowledge",
  "assign",
  "unassign",
  "update_severity",
  "resolve",
  "dismiss",
  "archive",
] as const;

export type AttentionLifecycleAction = (typeof ATTENTION_LIFECYCLE_ACTIONS)[number];

export function isAttentionLifecycleAction(
  value: string,
): value is AttentionLifecycleAction {
  return (ATTENTION_LIFECYCLE_ACTIONS as readonly string[]).includes(value);
}

export type AttentionLifecycleMutationOutcome = "applied" | "noop";

export type AttentionLifecycleMutationSuccess = {
  ok: true;
  action: AttentionLifecycleAction;
  attentionItemId: string;
  outcome: AttentionLifecycleMutationOutcome;
  committed: true;
  refreshRequired: false;
  returnPath: string;
};

export type AttentionLifecycleMutationFailure = {
  ok: false;
  action: AttentionLifecycleAction;
  committed: false;
  error: AttentionApplicationError;
  returnPath: string;
};

export type AttentionLifecycleMutationResult =
  | AttentionLifecycleMutationSuccess
  | AttentionLifecycleMutationFailure;

export type AttentionLifecycleActionVisibility = {
  acknowledge: boolean;
  assign: boolean;
  unassign: boolean;
  updateSeverity: boolean;
  resolve: boolean;
  dismiss: boolean;
  archive: boolean;
};

export const EMPTY_ATTENTION_LIFECYCLE_ACTION_VISIBILITY: AttentionLifecycleActionVisibility =
  {
    acknowledge: false,
    assign: false,
    unassign: false,
    updateSeverity: false,
    resolve: false,
    dismiss: false,
    archive: false,
  };
