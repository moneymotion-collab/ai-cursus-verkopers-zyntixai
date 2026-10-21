/**
 * Social Brand + Workspace foundation types (SMM-B1.2).
 * Minimal Brand identity only — Brand Brain belongs to SMM-B1.3.
 */

import type {
  SocialBrandId,
  SocialMemberId,
  SocialOrganizationId,
  SocialWorkspaceId,
} from "./types";

export type { SocialBrandId };

export type SocialBrand = {
  id: SocialBrandId;
  organizationId: SocialOrganizationId;
  displayName: string;
  customerId: string | null;
  createdByMemberId: SocialMemberId;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type SocialWorkspace = {
  id: SocialWorkspaceId;
  organizationId: SocialOrganizationId;
  brandId: SocialBrandId;
  displayName: string;
  createdByMemberId: SocialMemberId;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export const SOCIAL_WORKSPACE_CLIENT_FORBIDDEN_KEYS = [
  "accessToken",
  "refreshToken",
  "token",
  "ciphertext",
  "iv",
  "authTag",
  "authorizationCode",
  "clientSecret",
  "rawState",
  "state",
  "encryptionKey",
] as const;

export type SocialWorkspaceClientForbiddenKey =
  (typeof SOCIAL_WORKSPACE_CLIENT_FORBIDDEN_KEYS)[number];

export type SocialWorkspaceClientReadModel = {
  id: SocialWorkspaceId;
  organizationId: SocialOrganizationId;
  brandId: SocialBrandId;
  displayName: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toSocialWorkspaceClientReadModel(
  workspace: SocialWorkspace,
): SocialWorkspaceClientReadModel {
  return {
    id: workspace.id,
    organizationId: workspace.organizationId,
    brandId: workspace.brandId,
    displayName: workspace.displayName,
    archivedAt: workspace.archivedAt,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
}

export function isSocialWorkspaceArchived(
  workspace: Pick<SocialWorkspace, "archivedAt">,
): boolean {
  return workspace.archivedAt != null;
}

export function isSocialWorkspaceEligibleForConnection(
  workspace: Pick<SocialWorkspace, "archivedAt">,
): boolean {
  return !isSocialWorkspaceArchived(workspace);
}
