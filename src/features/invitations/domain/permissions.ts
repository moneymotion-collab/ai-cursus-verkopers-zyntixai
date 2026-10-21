import type {
  MembershipStatus,
  OrganizationRole,
} from "@/features/tasks/domain/permissions";
import { isKnownOrganizationRole } from "@/features/tasks/domain/permissions";
import type {
  OrganizationInvitationOrgStatus,
  OrganizationInvitationPermissionSet,
  OrganizationInvitationTargetRole,
} from "@/features/invitations/domain/types";
import { EMPTY_ORGANIZATION_INVITATION_PERMISSIONS } from "@/features/invitations/domain/types";

export const ORGANIZATION_INVITATION_TARGET_ROLES = [
  "admin",
  "staff",
  "viewer",
] as const satisfies readonly OrganizationInvitationTargetRole[];

const OWNER_INVITABLE_ROLES: readonly OrganizationInvitationTargetRole[] = [
  "admin",
  "staff",
  "viewer",
];

const ADMIN_INVITABLE_ROLES: readonly OrganizationInvitationTargetRole[] = [
  "staff",
  "viewer",
];

export function isOrganizationInvitationTargetRole(
  value: string,
): value is OrganizationInvitationTargetRole {
  return (ORGANIZATION_INVITATION_TARGET_ROLES as readonly string[]).includes(
    value,
  );
}

export function isActiveOrganizationMembershipStatus(
  status: MembershipStatus | null | undefined,
): status is "active" {
  return status === "active";
}

/**
 * Org must be active for invitation create/resend/accept/revoke usability.
 */
export function isOrganizationUsableForInvitationMutation(
  orgStatus: OrganizationInvitationOrgStatus | null | undefined,
): boolean {
  return orgStatus === "active";
}

function invitableRolesForActiveActor(
  actorRole: OrganizationRole,
): readonly OrganizationInvitationTargetRole[] {
  switch (actorRole) {
    case "owner":
      return OWNER_INVITABLE_ROLES;
    case "admin":
      return ADMIN_INVITABLE_ROLES;
    case "staff":
    case "viewer":
      return [];
    default:
      return [];
  }
}

/**
 * Roles the actor may invite, given role + membership status.
 * Never includes `owner`. Non-active membership yields [].
 */
export function getInvitableOrganizationRoles(
  actorRole: OrganizationRole | null | undefined,
  actorMembershipStatus: MembershipStatus | null | undefined,
): OrganizationInvitationTargetRole[] {
  if (
    !actorRole ||
    !isKnownOrganizationRole(actorRole) ||
    !isActiveOrganizationMembershipStatus(actorMembershipStatus)
  ) {
    return [];
  }

  return [...invitableRolesForActiveActor(actorRole)];
}

export function canCreateOrganizationInvitation(
  actorRole: OrganizationRole | null | undefined,
  actorMembershipStatus: MembershipStatus | null | undefined,
  targetRole: string,
): boolean {
  if (!isOrganizationInvitationTargetRole(targetRole)) {
    return false;
  }

  return getInvitableOrganizationRoles(
    actorRole,
    actorMembershipStatus,
  ).includes(targetRole);
}

/**
 * Manage (resend/revoke) authority by current actor vs invitation target role.
 * Inviter identity is intentionally ignored.
 */
export function canManageOrganizationInvitation(
  actorRole: OrganizationRole | null | undefined,
  actorMembershipStatus: MembershipStatus | null | undefined,
  invitationTargetRole: string,
): boolean {
  if (!isOrganizationInvitationTargetRole(invitationTargetRole)) {
    return false;
  }

  if (
    !actorRole ||
    !isKnownOrganizationRole(actorRole) ||
    !isActiveOrganizationMembershipStatus(actorMembershipStatus)
  ) {
    return false;
  }

  switch (actorRole) {
    case "owner":
      return true;
    case "admin":
      return (
        invitationTargetRole === "staff" || invitationTargetRole === "viewer"
      );
    case "staff":
    case "viewer":
      return false;
    default:
      return false;
  }
}

export function resolveOrganizationInvitationPermissions(
  actorRole: OrganizationRole | null | undefined,
  actorMembershipStatus: MembershipStatus | null | undefined,
): OrganizationInvitationPermissionSet {
  const invitableRoles = getInvitableOrganizationRoles(
    actorRole,
    actorMembershipStatus,
  );

  const canManage =
    canManageOrganizationInvitation(
      actorRole,
      actorMembershipStatus,
      "viewer",
    ) ||
    canManageOrganizationInvitation(actorRole, actorMembershipStatus, "admin");

  if (invitableRoles.length === 0 && !canManage) {
    return { ...EMPTY_ORGANIZATION_INVITATION_PERMISSIONS };
  }

  return {
    canCreateInvitation: invitableRoles.length > 0,
    canManageInvitation: canManage,
    invitableRoles,
  };
}
