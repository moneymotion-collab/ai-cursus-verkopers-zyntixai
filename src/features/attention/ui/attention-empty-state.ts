/**
 * Foundation empty-state copy for Attention.
 * Full filter/no-results product behavior belongs to B1.7.5-C.
 * This helper only distinguishes workspace-empty vs filtered no-results
 * when callers already know whether filters are active.
 */
export type AttentionEmptyState = {
  title: string;
  description: string;
};

export type AttentionEmptyStateInput = {
  /** True when the caller already applied non-default list filters. */
  hasActiveFilters?: boolean;
};

export function resolveAttentionEmptyState(
  input: AttentionEmptyStateInput = {},
): AttentionEmptyState {
  if (input.hasActiveFilters) {
    return {
      title: "No attention items match these filters",
      description:
        "Attention items may still exist for this organization. Clear or adjust filters to see more results.",
    };
  }

  return {
    title: "No attention items yet",
    description:
      "When Attention items are detected for enrollments in this organization, they appear here.",
  };
}
