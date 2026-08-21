import { describe, expect, it } from "vitest";
import {
  canManageSocialConnections,
  canScheduleSocialPublication,
  canViewSocialConnections,
  isOrganizationUsableForSocialConnectionMutation,
  resolveSocialConnectionPermissions,
} from "@/features/social-media/domain/permissions";
import { EMPTY_SOCIAL_CONNECTION_PERMISSIONS } from "@/features/social-media/domain/types";
import { provesSocialTenantAuthority } from "@/features/social-media/domain/tenant";
import type { MembershipStatus } from "@/features/tasks/domain/permissions";

describe("social connection permissions", () => {
  it("allows active owner and admin to connect, reauthorize, and disconnect", () => {
    for (const role of ["owner", "admin"] as const) {
      const permissions = resolveSocialConnectionPermissions(role, "active");
      expect(canManageSocialConnections(role, "active")).toBe(true);
      expect(canScheduleSocialPublication(role, "active")).toBe(true);
      expect(permissions).toEqual({
        canViewConnection: true,
        canConnect: true,
        canReauthorize: true,
        canDisconnect: true,
      });
    }
  });

  it("denies active staff connect, reauthorize, and disconnect", () => {
    expect(canManageSocialConnections("staff", "active")).toBe(false);
    expect(canScheduleSocialPublication("staff", "active")).toBe(false);
    expect(canViewSocialConnections("staff", "active")).toBe(true);
    expect(resolveSocialConnectionPermissions("staff", "active")).toEqual({
      canViewConnection: true,
      canConnect: false,
      canReauthorize: false,
      canDisconnect: false,
    });
  });

  it("keeps viewer read-only", () => {
    expect(canManageSocialConnections("viewer", "active")).toBe(false);
    expect(canScheduleSocialPublication("viewer", "active")).toBe(false);
    expect(canViewSocialConnections("viewer", "active")).toBe(true);
    expect(resolveSocialConnectionPermissions("viewer", "active")).toEqual({
      canViewConnection: true,
      canConnect: false,
      canReauthorize: false,
      canDisconnect: false,
    });
  });

  it("does not authorize suspended, invited, or removed members even if Owner/Admin", () => {
    const nonActive: MembershipStatus[] = ["invited", "suspended", "removed"];
    for (const status of nonActive) {
      for (const role of ["owner", "admin"] as const) {
        expect(canManageSocialConnections(role, status)).toBe(false);
        expect(canViewSocialConnections(role, status)).toBe(false);
        expect(resolveSocialConnectionPermissions(role, status)).toEqual(
          EMPTY_SOCIAL_CONNECTION_PERMISSIONS,
        );
      }
    }
  });

  it("requires an active organization for connection mutations", () => {
    expect(isOrganizationUsableForSocialConnectionMutation("active")).toBe(true);
    expect(isOrganizationUsableForSocialConnectionMutation("suspended")).toBe(
      false,
    );
    expect(isOrganizationUsableForSocialConnectionMutation("archived")).toBe(
      false,
    );
    expect(isOrganizationUsableForSocialConnectionMutation(null)).toBe(false);
  });
});

describe("cross-tenant invariant", () => {
  it("never treats a mismatched organization as authority", () => {
    expect(
      provesSocialTenantAuthority({
        actorUserId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        organizationId: "11111111-1111-4111-8111-111111111111",
        membershipIsActive: true,
        targetOrganizationId: "22222222-2222-4222-8222-222222222222",
      }),
    ).toBe(false);
  });

  it("requires active membership even when organization ids match", () => {
    expect(
      provesSocialTenantAuthority({
        actorUserId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        organizationId: "11111111-1111-4111-8111-111111111111",
        membershipIsActive: false,
        targetOrganizationId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBe(false);
  });

  it("proves authority only when actor, active membership, and target org match", () => {
    expect(
      provesSocialTenantAuthority({
        actorUserId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        organizationId: "11111111-1111-4111-8111-111111111111",
        membershipIsActive: true,
        targetOrganizationId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBe(true);
  });
});
