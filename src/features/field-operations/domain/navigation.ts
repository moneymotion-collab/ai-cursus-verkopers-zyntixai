export const SITES_ROUTE = "/sites";
export const WORK_ORDERS_ROUTE = "/work-orders";
export const DISPATCH_ROUTE = "/dispatch";

export function siteDetailHref(siteId: string, organizationId: string): string {
  return `${SITES_ROUTE}/${siteId}?org=${encodeURIComponent(organizationId)}`;
}

export function siteCreateHrefForProject(projectId: string, organizationId: string): string {
  return `${SITES_ROUTE}/new?org=${encodeURIComponent(organizationId)}&projectId=${encodeURIComponent(projectId)}`;
}

export function workOrderDetailHref(workOrderId: string, organizationId: string): string {
  return `${WORK_ORDERS_ROUTE}/${workOrderId}?org=${encodeURIComponent(organizationId)}`;
}

export function workOrderCreateHrefForSite(siteId: string, organizationId: string): string {
  return `${WORK_ORDERS_ROUTE}/new?org=${encodeURIComponent(organizationId)}&siteId=${encodeURIComponent(siteId)}`;
}
