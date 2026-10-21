import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import type { OrganizationInvitationTargetRole } from "@/features/invitations/domain/types";

/**
 * Safe active-member row for Member Administration read surface.
 * No auth ids as primary identity; no email (profiles do not expose privileged email).
 */
export type MemberAdminMember = {
  membershipId: string;
  displayName: string;
  role: OrganizationRole;
  status: "active";
  joinedAt: string | null;
};

/**
 * Pending invitation row for Owner/Admin operator UI.
 * Invitation credential secrets and raw tokens are intentionally absent from this type.
 */
export type PendingInvitationListItem = {
  invitationId: string;
  emailNormalized: string;
  role: OrganizationInvitationTargetRole;
  status: "pending";
  createdAt: string;
  expiresAt: string;
  invitedByMemberId: string;
  inviterDisplayName: string;
  /** Credential still valid (pending + now < expiresAt). */
  isCredentialValid: boolean;
  /** Pending row whose clock has reached/passed expiry (not healthy actionable). */
  isEffectivelyExpired: boolean;
};

export type MemberAdministrationReadErrorCode =
  | "query_failed"
  | "forbidden"
  | "unexpected";

export type MemberAdministrationMembersResult =
  | { ok: true; members: MemberAdminMember[] }
  | {
      ok: false;
      error: { code: MemberAdministrationReadErrorCode; message: string };
    };

export type MemberAdministrationPendingInvitationsResult =
  | { ok: true; invitations: PendingInvitationListItem[] }
  | {
      ok: false;
      error: { code: MemberAdministrationReadErrorCode; message: string };
    };
