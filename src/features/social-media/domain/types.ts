/**
 * Social Account Connection typed domain foundation (SMM-B1.1-A).
 * Pure TypeScript — no DB/RLS/RPC/OAuth/crypto/HTTP/UI coupling.
 *
 * Secret credential material must never appear on these types.
 */

export type SocialOrganizationId = string;
export type SocialWorkspaceId = string;
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

export type SocialConnectionOrgStatus = "active" | "suspended" | "archived";
