/**
 * B1.7.5-A forces lifecycle mutation CTAs hidden.
 * B1.7.6-A may add action foundation modules, but product shells must keep this false
 * until a later authorized subphase activates visible controls.
 */
export const ATTENTION_LIFECYCLE_ACTIONS_VISIBLE = false as const;

export function canShowAttentionLifecycleActions(): false {
  return ATTENTION_LIFECYCLE_ACTIONS_VISIBLE;
}
