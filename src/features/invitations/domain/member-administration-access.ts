import type {
  MembershipStatus,
  OrganizationRole,
} from "@/features/tasks/domain/permissions";
import { isKnownOrganizationRole } from "@/features/tasks/domain/permissions";
import { isActiveOrganizationMembershipStatus } from "@/features/invitations/domain/permissions";

/**
 * Route/read authority for Member Administration (/settings/members).
 * Owner + Admin with active membership only. Fail closed for all other cases.
 * Presentation hints only — server loaders remain authoritative.
 */
export function canAccessMemberAdministration(
  role: OrganizationRole | null | undefined,
  membershipStatus: MembershipStatus | null | undefined,
): boolean {
  if (!isActiveOrganizationMembershipStatus(membershipStatus)) {
    return false;
  }

  if (!role || !isKnownOrganizationRole(role)) {
    return false;
  }

  return role === "owner" || role === "admin";
}
