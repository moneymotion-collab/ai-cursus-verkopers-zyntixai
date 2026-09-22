import type { Metadata } from "next";

/**
 * Authenticated document-title contract (CB-VIS-1-R4-A).
 *
 * Privacy and performance boundary: titles are static, canonical, and
 * organization-agnostic. Do not load organization context, records, or
 * terminology overrides solely to populate a document title. Visible page
 * headings and navigation labels may still use organization terminology;
 * the browser title must not.
 *
 * Social routes remain out of scope and inherit the authenticated default.
 * Onboarding lives outside this route group and is not titled here.
 */
export const AUTHENTICATED_DOCUMENT_TITLE_BRAND = "ZyntixAI" as const;
export const AUTHENTICATED_DOCUMENT_TITLE_TEMPLATE =
  `%s | ${AUTHENTICATED_DOCUMENT_TITLE_BRAND}` as const;
export const AUTHENTICATED_DOCUMENT_TITLE_DEFAULT_SEGMENT = "Workspace" as const;
export const AUTHENTICATED_DOCUMENT_TITLE_DEFAULT =
  `${AUTHENTICATED_DOCUMENT_TITLE_DEFAULT_SEGMENT} | ${AUTHENTICATED_DOCUMENT_TITLE_BRAND}` as const;

export const AUTHENTICATED_IN_SCOPE_ROUTE_TITLES = {
  "/home": "Home",
  "/attention": "Attention",
  "/attention/[attentionItemId]": "Attention item",
  "/tasks": "Tasks",
  "/tasks/new": "New task",
  "/tasks/[taskId]": "Task",
  "/tasks/[taskId]/edit": "Edit task",
  "/tasks/[taskId]/complete": "Complete task",
  "/tasks/[taskId]/cancel": "Cancel task",
  "/tasks/[taskId]/archive": "Archive task",
  "/tasks/[taskId]/restore": "Restore task",
  "/tasks/[taskId]/reassign": "Reassign task",
  "/tasks/[taskId]/reschedule": "Reschedule task",
  "/leads": "Leads",
  "/leads/new": "New lead",
  "/leads/[leadId]": "Lead",
  "/leads/[leadId]/edit": "Edit lead",
  "/leads/[leadId]/archive": "Archive lead",
  "/leads/[leadId]/restore": "Restore lead",
  "/leads/[leadId]/status": "Change lead status",
  "/leads/[leadId]/stage": "Change lead stage",
  "/leads/[leadId]/convert": "Convert lead",
  "/customers": "Customers",
  "/customers/new": "New customer",
  "/customers/[customerId]": "Customer",
  "/customers/[customerId]/edit": "Edit customer",
  "/customers/[customerId]/archive": "Archive customer record",
  "/customers/[customerId]/restore": "Restore customer record",
  "/customers/[customerId]/status": "Change customer status",
  "/projects": "Projects",
  "/projects/new": "New project",
  "/projects/[projectId]": "Project",
  "/projects/[projectId]/edit": "Edit project",
  "/sites": "Sites",
  "/sites/new": "New site",
  "/sites/[siteId]": "Site",
  "/sites/[siteId]/edit": "Edit site",
  "/work-orders": "Work orders",
  "/work-orders/new": "New work order",
  "/work-orders/[workOrderId]": "Work order",
  "/work-orders/[workOrderId]/edit": "Edit work order",
  "/dispatch": "Dispatch",
  "/products": "Products",
  "/products/new": "New product",
  "/products/[productId]": "Product",
  "/products/[productId]/edit": "Edit product",
  "/orders": "Orders",
  "/orders/new": "New order",
  "/orders/[orderId]": "Order",
  "/inventory": "Inventory",
  "/inventory/[productId]/adjust": "Adjust inventory",
  "/fulfillment": "Fulfillment",
  "/programs": "Programs",
  "/programs/new": "New program",
  "/programs/[programId]": "Program",
  "/programs/[programId]/edit": "Edit program",
  "/programs/[programId]/status": "Change program status",
  "/programs/[programId]/archive": "Archive program",
  "/programs/[programId]/restore": "Restore program",
  "/enrollments": "Enrollments",
  "/enrollments/new": "New enrollment",
  "/enrollments/[enrollmentId]": "Enrollment",
  "/enrollments/[enrollmentId]/edit": "Edit enrollment",
  "/enrollments/[enrollmentId]/status": "Change enrollment status",
  "/enrollments/[enrollmentId]/archive": "Archive enrollment",
  "/enrollments/[enrollmentId]/restore": "Restore enrollment",
  "/progress": "Progress",
  "/progress/new": "New progress record",
  "/progress/[factId]": "Progress record",
  "/progress/[factId]/correct": "Correct progress record",
  "/progress/[factId]/void": "Void progress record",
  "/settings/members": "Members",
} as const;

export type AuthenticatedInScopeRoute =
  keyof typeof AUTHENTICATED_IN_SCOPE_ROUTE_TITLES;

export const AUTHENTICATED_OUT_OF_SCOPE_SOCIAL_ROUTES = [
  "/social",
  "/social/lifecycle",
  "/social/b18-instagram-publish",
  "/social/r1-instagram-connect",
  "/operator/social-beta",
  "/operator/social-beta/[organizationId]",
] as const;

export type AuthenticatedOutOfScopeSocialRoute =
  (typeof AUTHENTICATED_OUT_OF_SCOPE_SOCIAL_ROUTES)[number];

export function isAuthenticatedOutOfScopeSocialRoute(
  route: string,
): route is AuthenticatedOutOfScopeSocialRoute {
  return (AUTHENTICATED_OUT_OF_SCOPE_SOCIAL_ROUTES as readonly string[]).includes(
    route,
  );
}

export function applyAuthenticatedTitleTemplate(segment: string): string {
  if (segment.trim().length === 0) {
    throw new Error("Authenticated title segments must not be blank.");
  }
  if (segment.trim() !== segment) {
    throw new Error("Authenticated title segments must not include surrounding whitespace.");
  }
  if (segment.includes("|")) {
    throw new Error("Authenticated title segments must not include a title delimiter.");
  }
  if (segment.includes(AUTHENTICATED_DOCUMENT_TITLE_BRAND)) {
    throw new Error("Authenticated title segments must not include the brand suffix.");
  }

  return AUTHENTICATED_DOCUMENT_TITLE_TEMPLATE.replace("%s", segment);
}

export function resolveAuthenticatedPageDocumentTitle(
  route: AuthenticatedInScopeRoute,
): string {
  return applyAuthenticatedTitleTemplate(
    AUTHENTICATED_IN_SCOPE_ROUTE_TITLES[route],
  );
}

export function authenticatedLayoutMetadata(): Metadata {
  return {
    title: {
      default: AUTHENTICATED_DOCUMENT_TITLE_DEFAULT,
      template: AUTHENTICATED_DOCUMENT_TITLE_TEMPLATE,
    },
  };
}

export function authenticatedPageMetadata(
  route: AuthenticatedInScopeRoute,
): Metadata {
  return {
    title: AUTHENTICATED_IN_SCOPE_ROUTE_TITLES[route],
  };
}
