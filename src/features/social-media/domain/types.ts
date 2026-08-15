/**
 * Social Account Connection typed domain foundation (SMM-B1.1-A).
 * Pure TypeScript — no DB/RLS/RPC/OAuth/crypto/HTTP/UI coupling.
 *
 * Secret credential material must never appear on these types.
 */

export type SocialOrganizationId = string;
export type SocialWorkspaceId = string;
export type SocialBrandId = string;
export type SocialConnectionId = string;
export type SocialMemberId = string;
export type SocialUserId = string;
export type SocialCredentialReferenceId = string;
export type SocialOAuthIntentId = string;
export type SocialExternalAccountId = string;

export type SocialConnectionPermissionSet = {
  canViewConnection: boolean;
  canConnect: boolean;
  canReauthorize: boolean;
  canDisconnect: boolean;
};

export const EMPTY_SOCIAL_CONNECTION_PERMISSIONS: SocialConnectionPermissionSet =
  {
    canViewConnection: false,
    canConnect: false,
    canReauthorize: false,
    canDisconnect: false,
  };

export type SocialWorkspacePermissionSet = {
  canViewWorkspace: boolean;
  canCreateWorkspace: boolean;
  canUpdateWorkspace: boolean;
  canArchiveWorkspace: boolean;
};

export const EMPTY_SOCIAL_WORKSPACE_PERMISSIONS: SocialWorkspacePermissionSet = {
  canViewWorkspace: false,
  canCreateWorkspace: false,
  canUpdateWorkspace: false,
  canArchiveWorkspace: false,
};

export type SocialContentPermissionSet = {
  canViewContent: boolean;
  canCreateContent: boolean;
  canUpdateContent: boolean;
  canArchiveContent: boolean;
  canManageVariants: boolean;
  canManageMedia: boolean;
  canCreateVersions: boolean;
  canRequestReview: boolean;
  canCommentOnReview: boolean;
  canApproveContent: boolean;
  canManageSchedule: boolean;
};

export const EMPTY_SOCIAL_CONTENT_PERMISSIONS: SocialContentPermissionSet = {
  canViewContent: false,
  canCreateContent: false,
  canUpdateContent: false,
  canArchiveContent: false,
  canManageVariants: false,
  canManageMedia: false,
  canCreateVersions: false,
  canRequestReview: false,
  canCommentOnReview: false,
  canApproveContent: false,
  canManageSchedule: false,
};

export type SocialConnectionOrgStatus = "active" | "suspended" | "archived";
