/**
 * Canonical Programs route and navigation metadata.
 * Visible shell activation is enabled in B1.5.2 when list/create/detail routes exist.
 */

export const PROGRAMS_ROUTE = "/programs" as const;
export const PROGRAMS_NAV_LABEL = "Programs" as const;

/** Approved B1.5 primary-nav order after Customers and before Enrollments/Tasks. */
export const PROGRAMS_NAV_ORDER_AFTER = "customers" as const;

export const PROGRAM_ROUTE_PATTERNS = [
  "/programs",
  "/programs/new",
  "/programs/[programId]",
  "/programs/[programId]/edit",
  "/programs/[programId]/status",
  "/programs/[programId]/archive",
  "/programs/[programId]/restore",
] as const;

export function isProgramsPathname(pathname: string): boolean {
  return pathname === "/programs" || pathname.startsWith("/programs/");
}

export function buildProgramsListHref(organizationId?: string): string {
  if (!organizationId) {
    return PROGRAMS_ROUTE;
  }
  return `${PROGRAMS_ROUTE}?org=${encodeURIComponent(organizationId)}`;
}

export function buildProgramDetailHref(
  programId: string,
  organizationId?: string,
): string {
  const base = `${PROGRAMS_ROUTE}/${encodeURIComponent(programId)}`;
  if (!organizationId) {
    return base;
  }
  return `${base}?org=${encodeURIComponent(organizationId)}`;
}

export function buildProgramCreateHref(organizationId?: string): string {
  const base = `${PROGRAMS_ROUTE}/new`;
  if (!organizationId) {
    return base;
  }
  return `${base}?org=${encodeURIComponent(organizationId)}`;
}

export function buildProgramEditHref(
  programId: string,
  organizationId?: string,
): string {
  const base = `${PROGRAMS_ROUTE}/${encodeURIComponent(programId)}/edit`;
  if (!organizationId) {
    return base;
  }
  return `${base}?org=${encodeURIComponent(organizationId)}`;
}

/**
 * Visible primary-nav Programs link — activated in B1.5.2 once list/create/detail routes exist.
 */
export const PROGRAMS_NAV_VISIBLE = true as const;
