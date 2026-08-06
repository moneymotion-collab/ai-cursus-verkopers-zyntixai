/**
 * B1.7.5-A forces lifecycle mutation CTAs hidden.
 * Working action UX is reserved for B1.7.6 and must not appear in A–E product shells.
 */
export const ATTENTION_LIFECYCLE_ACTIONS_VISIBLE = false as const;

export function canShowAttentionLifecycleActions(): false {
  return ATTENTION_LIFECYCLE_ACTIONS_VISIBLE;
}
