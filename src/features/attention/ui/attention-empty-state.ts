/**
 * Foundation empty-state copy for Attention.
 * Distinguishes workspace-empty vs filtered no-results.
 */
export type AttentionEmptyState = {
  title: string;
  description: string;
  clearHref?: string;
};

export type AttentionEmptyStateInput = {
  hasActiveFilters?: boolean;
  clearHref?: string;
  outOfRangePage?: boolean;
};

export function resolveAttentionEmptyState(
  input: AttentionEmptyStateInput = {},
): AttentionEmptyState {
  if (input.outOfRangePage) {
    return {
      title: "No attention items on this page",
      description:
        "This page is outside the available results. Return to the first page to continue.",
      clearHref: input.clearHref,
    };
  }

  if (input.hasActiveFilters) {
    return {
      title: "No attention items match these filters",
      description:
        "Attention items may still exist for this organization. Clear or adjust filters to see more results.",
      clearHref: input.clearHref,
    };
  }

  return {
    title: "No attention items yet",
    description:
      "When Attention items are detected for enrollments in this organization, they appear here.",
  };
}
