import {
  buildProgressListQueryString,
  hasProgressRelationshipContext,
  type ProgressListUrlState,
} from "@/features/progress/ui/progress-list-search-params";

function hasOtherFilters(urlState: ProgressListUrlState): boolean {
  return Boolean(urlState.q || urlState.factType || urlState.includeVoided);
}

export type ProgressListEmptyState = {
  title: string;
  description: string;
  clearHref?: string;
};

/**
 * Resolves Progress list empty / no-results / voided-empty copy.
 * Keeps EMPTY, NO RESULTS, and VOIDED EMPTY distinct.
 */
export function resolveProgressListEmptyState(
  urlState: ProgressListUrlState,
): ProgressListEmptyState {
  if (urlState.includeVoided) {
    return {
      title: "No voided progress records",
      description:
        "No voided progress records match this view. Voided records stay in history for owners and admins; they are not deleted.",
      clearHref:
        hasOtherFilters(urlState) || hasProgressRelationshipContext(urlState)
          ? `/progress${buildProgressListQueryString({
              org: urlState.org,
              includeVoided: false,
              sort: urlState.sort,
              direction: urlState.direction,
              page: 1,
              pageSize: urlState.pageSize,
            })}`
          : undefined,
    };
  }

  if (urlState.q || urlState.factType || hasProgressRelationshipContext(urlState)) {
    return {
      title: "No progress records match these filters",
      description:
        "Progress records may still exist for this organization. Clear or adjust filters to see more results.",
      clearHref: `/progress${buildProgressListQueryString({
        org: urlState.org,
        includeVoided: false,
        sort: urlState.sort,
        direction: urlState.direction,
        page: 1,
        pageSize: urlState.pageSize,
      })}`,
    };
  }

  return {
    title: "No progress records yet",
    description:
      "When someone records progress for an enrollment in this organization, those records appear here.",
  };
}
