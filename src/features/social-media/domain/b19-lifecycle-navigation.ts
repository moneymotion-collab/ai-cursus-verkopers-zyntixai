/**
 * Navigation helpers for SMM-B1.9 lifecycle operator surface.
 */

export const B19_LIFECYCLE_ROUTE = "/social/lifecycle" as const;

export function buildB19LifecycleHref(input?: {
  organizationId?: string;
}): string {
  if (!input?.organizationId) {
    return B19_LIFECYCLE_ROUTE;
  }
  const params = new URLSearchParams({
    org: input.organizationId,
  });
  return `${B19_LIFECYCLE_ROUTE}?${params.toString()}`;
}
