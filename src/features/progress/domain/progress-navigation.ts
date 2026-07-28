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

export function buildProgressListHref(organizationId?: string): string {
  if (!organizationId) {
    return PROGRESS_ROUTE;
  }
  return `${PROGRESS_ROUTE}?org=${encodeURIComponent(organizationId)}`;
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
