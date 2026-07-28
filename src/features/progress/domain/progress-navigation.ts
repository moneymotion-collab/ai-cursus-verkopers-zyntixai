/**
 * Canonical Progress route and navigation metadata.
 * B1.6.2 enables visible shell activation for list/detail routes.
 */

export const PROGRESS_ROUTE = "/progress" as const;
export const PROGRESS_NAV_LABEL = "Progress" as const;

/** Approved B1.6 primary-nav order after Enrollments and before Tasks. */
export const PROGRESS_NAV_ORDER_AFTER = "enrollments" as const;

export const PROGRESS_ROUTE_PATTERNS = [
  "/progress",
  "/progress/new",
  "/progress/[factId]",
  "/progress/[factId]/void",
  "/progress/[factId]/correct",
] as const;

export function isProgressPathname(pathname: string): boolean {
  return pathname === "/progress" || pathname.startsWith("/progress/");
}

export type ProgressListHrefParams = {
  organizationId?: string;
  enrollmentId?: string;
  programId?: string;
};

/**
 * Build Progress list href.
 * Backward compatible: a string first arg is treated as organizationId.
 */
export function buildProgressListHref(
  organizationIdOrParams?: string | ProgressListHrefParams,
): string {
  const params: ProgressListHrefParams =
    typeof organizationIdOrParams === "string"
      ? { organizationId: organizationIdOrParams }
      : (organizationIdOrParams ?? {});

  const search = new URLSearchParams();
  if (params.organizationId) {
    search.set("org", params.organizationId);
  }
  if (params.enrollmentId) {
    search.set("enrollmentId", params.enrollmentId);
  }
  if (params.programId) {
    search.set("programId", params.programId);
  }
  const query = search.toString();
  return query.length > 0 ? `${PROGRESS_ROUTE}?${query}` : PROGRESS_ROUTE;
}

export function buildProgressDetailHref(
  factId: string,
  organizationId?: string,
): string {
  const base = `${PROGRESS_ROUTE}/${encodeURIComponent(factId)}`;
  if (!organizationId) {
    return base;
  }
  return `${base}?org=${encodeURIComponent(organizationId)}`;
}

export function buildProgressCreateHref(params?: {
  organizationId?: string;
  enrollmentId?: string;
}): string {
  const search = new URLSearchParams();
  if (params?.organizationId) {
    search.set("org", params.organizationId);
  }
  if (params?.enrollmentId) {
    search.set("enrollmentId", params.enrollmentId);
  }
  const query = search.toString();
  return query.length > 0 ? `${PROGRESS_ROUTE}/new?${query}` : `${PROGRESS_ROUTE}/new`;
}

export function buildProgressVoidHref(
  factId: string,
  organizationId?: string,
): string {
  const base = `${PROGRESS_ROUTE}/${encodeURIComponent(factId)}/void`;
  if (!organizationId) {
    return base;
  }
  return `${base}?org=${encodeURIComponent(organizationId)}`;
}

export function buildProgressCorrectHref(
  factId: string,
  organizationId?: string,
): string {
  const base = `${PROGRESS_ROUTE}/${encodeURIComponent(factId)}/correct`;
  if (!organizationId) {
    return base;
  }
  return `${base}?org=${encodeURIComponent(organizationId)}`;
}

/**
 * Visible primary-nav Progress link — enabled for B1.6.2 list/detail routes.
 */
export const PROGRESS_NAV_VISIBLE = true as const;
