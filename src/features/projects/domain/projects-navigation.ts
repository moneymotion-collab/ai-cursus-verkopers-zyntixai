export const PROJECTS_ROUTE = "/projects";
export const PROJECTS_NAV_LABEL = "Projects";

export function buildProjectListHref(organizationId: string): string {
  return `${PROJECTS_ROUTE}?org=${encodeURIComponent(organizationId)}`;
}

export function buildProjectCreateHref(organizationId: string): string {
  return `${PROJECTS_ROUTE}/new?org=${encodeURIComponent(organizationId)}`;
}

export function buildProjectDetailHref(
  projectId: string,
  organizationId: string,
): string {
  return `${PROJECTS_ROUTE}/${encodeURIComponent(projectId)}?org=${encodeURIComponent(organizationId)}`;
}

export function buildProjectEditHref(
  projectId: string,
  organizationId: string,
): string {
  return `${PROJECTS_ROUTE}/${encodeURIComponent(projectId)}/edit?org=${encodeURIComponent(organizationId)}`;
}

export function isProjectsPathname(pathname: string): boolean {
  return pathname === PROJECTS_ROUTE || pathname.startsWith(`${PROJECTS_ROUTE}/`);
}
