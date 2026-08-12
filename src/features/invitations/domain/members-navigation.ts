/**
 * Canonical Members (Member Administration) route and navigation metadata.
 * Slice 1 — read surface only.
 */

import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import { canAccessMemberAdministration } from "@/features/invitations/domain/member-administration-access";

export const MEMBERS_ROUTE = "/settings/members" as const;
export const MEMBERS_NAV_LABEL = "Members" as const;

/** Primary-nav order after Tasks (settings-adjacent). */
export const MEMBERS_NAV_ORDER_AFTER = "tasks" as const;

export const MEMBERS_ROUTE_PATTERNS = ["/settings/members"] as const;

export function isMembersPathname(pathname: string): boolean {
  return (
    pathname === MEMBERS_ROUTE || pathname.startsWith(`${MEMBERS_ROUTE}/`)
  );
}

export type MembersListHrefParams = {
  organizationId?: string;
};

/**
 * Build Members list href. Optional org selection for multi-organization operators.
 */
export function buildMembersListHref(
  organizationIdOrParams?: string | MembersListHrefParams,
): string {
  const params: MembersListHrefParams =
    typeof organizationIdOrParams === "string"
      ? { organizationId: organizationIdOrParams }
      : (organizationIdOrParams ?? {});

  const search = new URLSearchParams();
  if (params.organizationId) {
    search.set("org", params.organizationId);
  }
  const query = search.toString();
  return query.length > 0 ? `${MEMBERS_ROUTE}?${query}` : MEMBERS_ROUTE;
}

/**
 * Feature flag for Members primary-nav capability.
 * Actual visibility is fail-closed via resolveMembersNavVisible.
 * Route authorization remains authoritative for Staff/Viewer.
 */
export const MEMBERS_NAV_VISIBLE = true as const;

/**
 * Minimal org option shape for Members nav derivation.
 * Uses already-loaded AppShell organizationOptions roles — no DB fetch.
 */
export type MembersNavOrganizationOption = {
  organizationId: string;
  role: OrganizationRole;
};

export type ResolveMembersNavVisibleInput = {
  /** Explicit AppShell override when provided. */
  explicitVisibility?: boolean;
  organizationOptions?: readonly MembersNavOrganizationOption[] | null;
  selectedOrganizationId?: string;
};

/**
 * Fail-closed Members primary-nav visibility.
 * Presentation only — never substitutes for /settings/members route authorization.
 */
export function resolveMembersNavVisible(
  input: ResolveMembersNavVisibleInput,
): boolean {
  if (!MEMBERS_NAV_VISIBLE) {
    return false;
  }

  if (input.explicitVisibility === false) {
    return false;
  }

  if (input.explicitVisibility === true) {
    return true;
  }

  const options = input.organizationOptions ?? [];
  if (options.length === 0) {
    return false;
  }

  let option: MembersNavOrganizationOption | undefined;

  if (input.selectedOrganizationId) {
    option = options.find(
      (candidate) => candidate.organizationId === input.selectedOrganizationId,
    );
    if (!option) {
      return false;
    }
  } else if (options.length === 1) {
    option = options[0];
  } else {
    // Multi-org without authoritative selection — fail closed.
    return false;
  }

  return canAccessMemberAdministration(option.role, "active");
}
