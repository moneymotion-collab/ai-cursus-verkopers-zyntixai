/**
 * Canonical Enrollments route and navigation metadata.
 * Visible shell activation is deferred until list/create/detail routes exist.
 */

export const ENROLLMENTS_ROUTE = "/enrollments" as const;
export const ENROLLMENTS_NAV_LABEL = "Enrollments" as const;

/** Approved B1.5 primary-nav order after Programs and before Tasks. */
export const ENROLLMENTS_NAV_ORDER_AFTER = "programs" as const;

export const ENROLLMENT_ROUTE_PATTERNS = [
  "/enrollments",
  "/enrollments/new",
  "/enrollments/[enrollmentId]",
  "/enrollments/[enrollmentId]/edit",
  "/enrollments/[enrollmentId]/status",
  "/enrollments/[enrollmentId]/archive",
  "/enrollments/[enrollmentId]/restore",
] as const;

export function isEnrollmentsPathname(pathname: string): boolean {
  return pathname === "/enrollments" || pathname.startsWith("/enrollments/");
}

export function buildEnrollmentsListHref(organizationId?: string): string {
  if (!organizationId) {
    return ENROLLMENTS_ROUTE;
  }
  return `${ENROLLMENTS_ROUTE}?org=${encodeURIComponent(organizationId)}`;
}

export function buildEnrollmentDetailHref(
  enrollmentId: string,
  organizationId?: string,
): string {
  const base = `${ENROLLMENTS_ROUTE}/${encodeURIComponent(enrollmentId)}`;
  if (!organizationId) {
    return base;
  }
  return `${base}?org=${encodeURIComponent(organizationId)}`;
}

export function buildEnrollmentCreateHref(organizationId?: string): string {
  const base = `${ENROLLMENTS_ROUTE}/new`;
  if (!organizationId) {
    return base;
  }
  return `${base}?org=${encodeURIComponent(organizationId)}`;
}

export function buildEnrollmentEditHref(
  enrollmentId: string,
  organizationId?: string,
): string {
  const base = `${ENROLLMENTS_ROUTE}/${encodeURIComponent(enrollmentId)}/edit`;
  if (!organizationId) {
    return base;
  }
  return `${base}?org=${encodeURIComponent(organizationId)}`;
}

/**
 * Visible primary-nav Enrollments link — remains hidden in B1.5.4 foundation.
 * Later list/create/detail phases may flip this to true once routes exist.
 */
export const ENROLLMENTS_NAV_VISIBLE = false as const;
