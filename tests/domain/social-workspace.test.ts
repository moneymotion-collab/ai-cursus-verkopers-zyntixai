import { describe, expect, it } from "vitest";
import {
  canManageSocialWorkspaces,
  canViewSocialWorkspaces,
  resolveSocialWorkspacePermissions,
} from "@/features/social-media/domain/permissions";
import {
  isSocialWorkspaceEligibleForConnection,
  toSocialWorkspaceClientReadModel,
  SOCIAL_WORKSPACE_CLIENT_FORBIDDEN_KEYS,
  type SocialWorkspace,
} from "@/features/social-media/domain/workspace";
import {
  SOCIAL_WORKSPACE_EVENT_TYPES,
  isSocialWorkspaceEventType,
} from "@/features/social-media/domain/workspace-events";

const sampleWorkspace: SocialWorkspace = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaac01",
  organizationId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01",
  brandId: "cccccccc-cccc-4ccc-8ccc-cccccccccc01",
  displayName: "Brand A",
  createdByMemberId: "dddddddd-dddd-4ddd-8ddd-dddddddddd01",
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
  archivedAt: null,
};

describe("SMM-B1.2 social workspace domain contracts", () => {
  it("limits workspace mutations to active Owner/Admin", () => {
    expect(canManageSocialWorkspaces("owner", "active")).toBe(true);
    expect(canManageSocialWorkspaces("admin", "active")).toBe(true);
    expect(canManageSocialWorkspaces("staff", "active")).toBe(false);
    expect(canManageSocialWorkspaces("viewer", "active")).toBe(false);
    expect(canManageSocialWorkspaces("owner", "suspended")).toBe(false);
    expect(canViewSocialWorkspaces("staff", "active")).toBe(true);
    expect(resolveSocialWorkspacePermissions("viewer", "active")).toEqual({
      canViewWorkspace: true,
      canCreateWorkspace: false,
      canUpdateWorkspace: false,
      canArchiveWorkspace: false,
    });
  });

  it("treats archived workspaces as ineligible for new connections", () => {
    expect(isSocialWorkspaceEligibleForConnection(sampleWorkspace)).toBe(true);
    expect(
      isSocialWorkspaceEligibleForConnection({
        ...sampleWorkspace,
        archivedAt: "2026-08-15T12:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("exposes a client-safe workspace read model without secret keys", () => {
    const readModel = toSocialWorkspaceClientReadModel(sampleWorkspace);
    expect(readModel).toEqual({
      id: sampleWorkspace.id,
      organizationId: sampleWorkspace.organizationId,
      brandId: sampleWorkspace.brandId,
      displayName: sampleWorkspace.displayName,
      archivedAt: null,
      createdAt: sampleWorkspace.createdAt,
      updatedAt: sampleWorkspace.updatedAt,
    });
    for (const key of SOCIAL_WORKSPACE_CLIENT_FORBIDDEN_KEYS) {
      expect(readModel).not.toHaveProperty(key);
    }
  });

  it("locks workspace audit event types", () => {
    expect(SOCIAL_WORKSPACE_EVENT_TYPES).toEqual([
      "social_workspace_created",
      "social_workspace_updated",
      "social_workspace_archived",
    ]);
    expect(isSocialWorkspaceEventType("social_workspace_created")).toBe(true);
    expect(isSocialWorkspaceEventType("social_connection_initiated")).toBe(
      false,
    );
  });
});
