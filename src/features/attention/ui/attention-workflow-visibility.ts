/**
 * Product lifecycle CTA gates.
 *
 * - ATTENTION_LIFECYCLE_ACTIONS_VISIBLE stays false so out-of-scope actions are
 *   never broadly activated by this flag alone.
 * - B1.7.6-B uses a narrow acknowledge/severity gate.
 * - B1.7.6-C uses a narrow assignment gate only.
 * - B1.7.6-D uses a narrow resolve/dismiss gate only.
 * - B1.7.6-E uses a narrow archive gate only.
 */
export const ATTENTION_LIFECYCLE_ACTIONS_VISIBLE = false as const;

/** Narrow gate for B1.7.6-B Acknowledge + Update Severity only. */
export const ATTENTION_ACKNOWLEDGE_SEVERITY_ACTIONS_VISIBLE = true as const;

/** Narrow gate for B1.7.6-C Assign + Unassign only. */
export const ATTENTION_ASSIGNMENT_ACTIONS_VISIBLE = true as const;

/** Narrow gate for B1.7.6-D Resolve + Dismiss only. */
export const ATTENTION_RESOLUTION_DISMISS_ACTIONS_VISIBLE = true as const;

/** Narrow gate for B1.7.6-E Archive only. */
export const ATTENTION_ARCHIVE_ACTION_VISIBLE = true as const;

export function canShowAttentionLifecycleActions(): false {
  return ATTENTION_LIFECYCLE_ACTIONS_VISIBLE;
}

export function canShowAttentionAcknowledgeSeverityActions(): boolean {
  return ATTENTION_ACKNOWLEDGE_SEVERITY_ACTIONS_VISIBLE;
}

export function canShowAttentionAssignmentActions(): boolean {
  return ATTENTION_ASSIGNMENT_ACTIONS_VISIBLE;
}

export function canShowAttentionResolutionDismissActions(): boolean {
  return ATTENTION_RESOLUTION_DISMISS_ACTIONS_VISIBLE;
}

export function canShowAttentionArchiveAction(): boolean {
  return ATTENTION_ARCHIVE_ACTION_VISIBLE;
}
