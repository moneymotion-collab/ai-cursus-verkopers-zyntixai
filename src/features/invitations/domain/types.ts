/**
 * Organization Invitation typed domain foundation.
 * Pure TypeScript only — no DB/RLS/RPC/UI/email coupling.
 */

export type OrganizationInvitationStatus =
  | "pending"
  | "accepted"
  | "revoked"
  | "expired";

/**
 * Roles that may appear as invitation targets.
 * `owner` is intentionally unrepresentable.
 */
export type OrganizationInvitationTargetRole = "admin" | "staff" | "viewer";

export type OrganizationInvitationEventType =
  | "invitation_created"
  | "invitation_resent"
  | "invitation_revoked"
  | "invitation_accepted";

/**
 * Minimal org-status input for invitation mutation usability.
 * Aligns with organizations.status CHECK values; not a shared org abstraction.
 */
export type OrganizationInvitationOrgStatus =
  | "active"
  | "suspended"
  | "archived";

export type OrganizationInvitationPermissionSet = {
  canCreateInvitation: boolean;
  canManageInvitation: boolean;
  invitableRoles: readonly OrganizationInvitationTargetRole[];
};

export const EMPTY_ORGANIZATION_INVITATION_PERMISSIONS: OrganizationInvitationPermissionSet =
  {
    canCreateInvitation: false,
    canManageInvitation: false,
    invitableRoles: [],
  };

/**
 * Internal domain outcome vocabulary for later application/RPC layers.
 * Not a public/unauthenticated API surface — do not expose directly.
 */
export type OrganizationInvitationDomainResultCode =
  | "success"
  | "already_member"
  | "existing_membership_requires_admin_action"
  | "invite_already_pending"
  | "invite_expired"
  | "invite_revoked"
  | "invite_not_found_or_unavailable"
  | "email_mismatch"
  | "forbidden"
  | "invalid_input"
  | "unexpected";

export type OrganizationInvitationDomainError = {
  code: Exclude<OrganizationInvitationDomainResultCode, "success">;
  message?: string;
};

export type OrganizationInvitationDomainResult<T = void> =
  | { ok: true; code: "success"; value: T }
  | { ok: false; error: OrganizationInvitationDomainError };
