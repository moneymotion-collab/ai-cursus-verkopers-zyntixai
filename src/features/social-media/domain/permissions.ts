import type {
  MembershipStatus,
  OrganizationRole,
} from "@/features/tasks/domain/permissions";
import { isKnownOrganizationRole } from "@/features/tasks/domain/permissions";
import { isActiveOrganizationMembershipStatus } from "@/features/invitations/domain/permissions";
import {
  EMPTY_SOCIAL_CONNECTION_PERMISSIONS,
  type SocialConnectionOrgStatus,
  type SocialConnectionPermissionSet,
} from "./types";

/**
 * Connection-management mutations: Owner and Admin only, and only when
 * membership is active. Staff cannot connect/reauthorize/disconnect.
 * Viewer is read-only. Suspended/inactive members are never authorized
 * merely because their stored role is Owner/Admin.
 *
 * UI visibility is not authorization. Later RPCs must re-enforce this.
 */
export function isOrganizationUsableForSocialConnectionMutation(
  orgStatus: SocialConnectionOrgStatus | string | null | undefined,
): boolean {
  return orgStatus === "active";
}

function isActiveMembershipForSocialConnections(
  membershipStatus: MembershipStatus | string | null | undefined,
): membershipStatus is "active" {
  if (
    membershipStatus !== "invited" &&
    membershipStatus !== "active" &&
    membershipStatus !== "suspended" &&
    membershipStatus !== "removed"
  ) {
    return false;
  }
  return isActiveOrganizationMembershipStatus(membershipStatus);
}

export function canManageSocialConnections(
  role: OrganizationRole | string | null | undefined,
  membershipStatus: MembershipStatus | string | null | undefined,
): boolean {
  if (typeof role !== "string" || !isKnownOrganizationRole(role)) {
    return false;
  }
  if (!isActiveMembershipForSocialConnections(membershipStatus)) {
    return false;
  }
  return role === "owner" || role === "admin";
}

export function canViewSocialConnections(
  role: OrganizationRole | string | null | undefined,
  membershipStatus: MembershipStatus | string | null | undefined,
): boolean {
  if (typeof role !== "string" || !isKnownOrganizationRole(role)) {
    return false;
  }
  if (!isActiveMembershipForSocialConnections(membershipStatus)) {
    return false;
  }
  return true;
}

export function resolveSocialConnectionPermissions(
  role: OrganizationRole | string | null | undefined,
  membershipStatus: MembershipStatus | string | null | undefined,
): SocialConnectionPermissionSet {
  if (!canViewSocialConnections(role, membershipStatus)) {
    return EMPTY_SOCIAL_CONNECTION_PERMISSIONS;
  }
  const canMutate = canManageSocialConnections(role, membershipStatus);
  return {
    canViewConnection: true,
    canConnect: canMutate,
    canReauthorize: canMutate,
    canDisconnect: canMutate,
  };
}
