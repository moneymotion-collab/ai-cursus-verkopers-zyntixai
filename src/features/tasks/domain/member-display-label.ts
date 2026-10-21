/**
 * Deterministic assignee/member display-label contract (BETA1-LR-2-R1).
 * Uses only safe user-visible name fields. Never emails, auth IDs, or membership UUIDs.
 */

export const MEMBER_DISPLAY_FALLBACK_LABEL = "Team member" as const;

export function resolveMemberDisplayLabel(input: {
  displayName?: string | null;
  metadataDisplayName?: string | null;
}): string {
  const displayName = input.displayName?.trim();
  if (displayName) {
    return displayName;
  }

  const metadataDisplayName = input.metadataDisplayName?.trim();
  if (metadataDisplayName) {
    return metadataDisplayName;
  }

  return MEMBER_DISPLAY_FALLBACK_LABEL;
}
