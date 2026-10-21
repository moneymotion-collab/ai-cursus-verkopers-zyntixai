import { describe, expect, it } from "vitest";
import { canAccessMemberAdministration } from "@/features/invitations/domain/member-administration-access";

describe("canAccessMemberAdministration", () => {
  it("allows active Owner and Admin", () => {
    expect(canAccessMemberAdministration("owner", "active")).toBe(true);
    expect(canAccessMemberAdministration("admin", "active")).toBe(true);
  });

  it("denies Staff and Viewer even when active", () => {
    expect(canAccessMemberAdministration("staff", "active")).toBe(false);
    expect(canAccessMemberAdministration("viewer", "active")).toBe(false);
  });

  it("denies non-active memberships for every role", () => {
    for (const role of ["owner", "admin", "staff", "viewer"] as const) {
      expect(canAccessMemberAdministration(role, "suspended")).toBe(false);
      expect(canAccessMemberAdministration(role, "removed")).toBe(false);
      expect(canAccessMemberAdministration(role, "invited")).toBe(false);
      expect(canAccessMemberAdministration(role, null)).toBe(false);
    }
  });

  it("fail-closes on missing role", () => {
    expect(canAccessMemberAdministration(null, "active")).toBe(false);
    expect(canAccessMemberAdministration(undefined, "active")).toBe(false);
  });
});
