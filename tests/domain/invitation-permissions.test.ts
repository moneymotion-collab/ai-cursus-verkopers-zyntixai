import { describe, expect, it } from "vitest";
import {
  canCreateOrganizationInvitation,
  canManageOrganizationInvitation,
  getInvitableOrganizationRoles,
  isOrganizationUsableForInvitationMutation,
  resolveOrganizationInvitationPermissions,
} from "@/features/invitations/domain/permissions";
import { EMPTY_ORGANIZATION_INVITATION_PERMISSIONS } from "@/features/invitations/domain/types";
import type { MembershipStatus } from "@/features/tasks/domain/permissions";

describe("organization invitation create matrix", () => {
  it("allows active owner to invite admin, staff, and viewer — never owner", () => {
    const roles = getInvitableOrganizationRoles("owner", "active");
    expect(roles).toEqual(["admin", "staff", "viewer"]);
    expect(roles).not.toContain("owner");

    expect(canCreateOrganizationInvitation("owner", "active", "admin")).toBe(
      true,
    );
    expect(canCreateOrganizationInvitation("owner", "active", "staff")).toBe(
      true,
    );
    expect(canCreateOrganizationInvitation("owner", "active", "viewer")).toBe(
      true,
    );
    expect(canCreateOrganizationInvitation("owner", "active", "owner")).toBe(
      false,
    );
  });

  it("allows active admin to invite staff and viewer only", () => {
    expect(getInvitableOrganizationRoles("admin", "active")).toEqual([
      "staff",
      "viewer",
    ]);
    expect(canCreateOrganizationInvitation("admin", "active", "staff")).toBe(
      true,
    );
    expect(canCreateOrganizationInvitation("admin", "active", "viewer")).toBe(
      true,
    );
    expect(canCreateOrganizationInvitation("admin", "active", "admin")).toBe(
      false,
    );
    expect(canCreateOrganizationInvitation("admin", "active", "owner")).toBe(
      false,
    );
  });

  it("denies active staff and viewer for all targets", () => {
    for (const role of ["staff", "viewer"] as const) {
      expect(getInvitableOrganizationRoles(role, "active")).toEqual([]);
      for (const target of ["admin", "staff", "viewer", "owner"] as const) {
        expect(canCreateOrganizationInvitation(role, "active", target)).toBe(
          false,
        );
      }
    }
  });

  it("denies non-active owner and admin for all targets", () => {
    const nonActive: MembershipStatus[] = ["invited", "suspended", "removed"];
    for (const status of nonActive) {
      for (const role of ["owner", "admin"] as const) {
        expect(getInvitableOrganizationRoles(role, status)).toEqual([]);
        expect(canCreateOrganizationInvitation(role, status, "staff")).toBe(
          false,
        );
        expect(canCreateOrganizationInvitation(role, status, "viewer")).toBe(
          false,
        );
        expect(canCreateOrganizationInvitation(role, status, "admin")).toBe(
          false,
        );
      }
    }
  });
});

describe("organization invitation manage matrix", () => {
  it("allows active owner to manage admin, staff, and viewer invitations", () => {
    expect(canManageOrganizationInvitation("owner", "active", "admin")).toBe(
      true,
    );
    expect(canManageOrganizationInvitation("owner", "active", "staff")).toBe(
      true,
    );
    expect(canManageOrganizationInvitation("owner", "active", "viewer")).toBe(
      true,
    );
  });

  it("allows active admin to manage staff and viewer, not admin", () => {
    expect(canManageOrganizationInvitation("admin", "active", "staff")).toBe(
      true,
    );
    expect(canManageOrganizationInvitation("admin", "active", "viewer")).toBe(
      true,
    );
    expect(canManageOrganizationInvitation("admin", "active", "admin")).toBe(
      false,
    );
  });

  it("denies staff and viewer manage for all invitation targets", () => {
    for (const role of ["staff", "viewer"] as const) {
      for (const target of ["admin", "staff", "viewer"] as const) {
        expect(canManageOrganizationInvitation(role, "active", target)).toBe(
          false,
        );
      }
    }
  });

  it("denies suspended and other non-active actors manage rights", () => {
    for (const status of ["invited", "suspended", "removed"] as const) {
      expect(canManageOrganizationInvitation("owner", status, "staff")).toBe(
        false,
      );
      expect(canManageOrganizationInvitation("admin", status, "viewer")).toBe(
        false,
      );
    }
  });
});

describe("resolveOrganizationInvitationPermissions", () => {
  it("returns create+manage for active owner/admin and empty for staff/viewer", () => {
    const owner = resolveOrganizationInvitationPermissions("owner", "active");
    expect(owner.canCreateInvitation).toBe(true);
    expect(owner.canManageInvitation).toBe(true);
    expect(owner.invitableRoles).toEqual(["admin", "staff", "viewer"]);

    const admin = resolveOrganizationInvitationPermissions("admin", "active");
    expect(admin.canCreateInvitation).toBe(true);
    expect(admin.canManageInvitation).toBe(true);
    expect(admin.invitableRoles).toEqual(["staff", "viewer"]);

    expect(
      resolveOrganizationInvitationPermissions("staff", "active"),
    ).toEqual(EMPTY_ORGANIZATION_INVITATION_PERMISSIONS);
  });

  it("returns empty permissions for suspended owner", () => {
    expect(
      resolveOrganizationInvitationPermissions("owner", "suspended"),
    ).toEqual(EMPTY_ORGANIZATION_INVITATION_PERMISSIONS);
  });
});

describe("organization usability for invitation mutation", () => {
  it("allows only active organizations", () => {
    expect(isOrganizationUsableForInvitationMutation("active")).toBe(true);
    expect(isOrganizationUsableForInvitationMutation("suspended")).toBe(false);
    expect(isOrganizationUsableForInvitationMutation("archived")).toBe(false);
    expect(isOrganizationUsableForInvitationMutation(null)).toBe(false);
  });
});
