export type {
  OrganizationInvitationStatus,
  OrganizationInvitationTargetRole,
  OrganizationInvitationEventType,
  OrganizationInvitationOrgStatus,
  OrganizationInvitationPermissionSet,
  OrganizationInvitationDomainResultCode,
  OrganizationInvitationDomainError,
  OrganizationInvitationDomainResult,
} from "@/features/invitations/domain/types";

export { EMPTY_ORGANIZATION_INVITATION_PERMISSIONS } from "@/features/invitations/domain/types";

export {
  ORGANIZATION_INVITATION_STATUSES,
  TERMINAL_ORGANIZATION_INVITATION_STATUSES,
  NON_TERMINAL_ORGANIZATION_INVITATION_STATUSES,
  isOrganizationInvitationStatus,
  isTerminalOrganizationInvitationStatus,
  isNonTerminalOrganizationInvitationStatus,
} from "@/features/invitations/domain/status";

export {
  ORGANIZATION_INVITATION_EVENT_TYPES,
  isOrganizationInvitationEventType,
} from "@/features/invitations/domain/events";

export { normalizeOrganizationInvitationEmail } from "@/features/invitations/domain/email";

export {
  isOrganizationInvitationCredentialValid,
  isOrganizationInvitationEffectivelyExpired,
} from "@/features/invitations/domain/expiry";
export type { OrganizationInvitationCredentialInput } from "@/features/invitations/domain/expiry";

export {
  isOrganizationInvitationAcceptable,
  isOrganizationInvitationResendable,
  isOrganizationInvitationRevocable,
  isOrganizationInvitationLifecycleTerminal,
  isOrganizationInvitationLifecycleEffectivelyExpired,
} from "@/features/invitations/domain/lifecycle";
export type { OrganizationInvitationLifecycleInput } from "@/features/invitations/domain/lifecycle";

export {
  ORGANIZATION_INVITATION_TARGET_ROLES,
  isOrganizationInvitationTargetRole,
  isActiveOrganizationMembershipStatus,
  isOrganizationUsableForInvitationMutation,
  getInvitableOrganizationRoles,
  canCreateOrganizationInvitation,
  canManageOrganizationInvitation,
  resolveOrganizationInvitationPermissions,
} from "@/features/invitations/domain/permissions";
