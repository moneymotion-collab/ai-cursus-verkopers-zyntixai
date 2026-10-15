import type { ModuleNavVisibility } from "@/features/product-access/domain/types";

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
  navVisibility?: ModuleNavVisibility;
  projectPlural?: string;
};

function workspaceEmptyDescription(input: AttentionEmptyStateInput): string {
  const subjects: string[] = [];
  if (input.navVisibility?.enrollments) {
    subjects.push("enrollments");
  }
  if (input.navVisibility?.projects) {
    subjects.push((input.projectPlural ?? "Projects").toLowerCase());
  }
  if (subjects.length === 0) {
    return "When Attention items are detected for this organization, they appear here.";
  }
  const named =
    subjects.length === 1
      ? subjects[0]
      : `${subjects.slice(0, -1).join(", ")} or ${subjects[subjects.length - 1]}`;
  return `When Attention items are detected for ${named} in this organization, they appear here.`;
}

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
    description: workspaceEmptyDescription(input),
  };
}
