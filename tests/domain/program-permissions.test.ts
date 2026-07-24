import { describe, expect, it } from "vitest";
import { resolveProgramPermissions } from "@/features/programs/domain/permissions";

describe("resolveProgramPermissions", () => {
  it("grants owner/admin full non-archived capabilities", () => {
    for (const role of ["owner", "admin"] as const) {
      const permissions = resolveProgramPermissions(role, { isArchived: false });
      expect(permissions.canListPrograms).toBe(true);
      expect(permissions.canViewArchivedPrograms).toBe(true);
      expect(permissions.canCreateProgram).toBe(true);
      expect(permissions.canUpdateProgram).toBe(true);
      expect(permissions.canTransitionProgramStatus).toBe(true);
      expect(permissions.canArchiveProgram).toBe(true);
      expect(permissions.canRestoreProgram).toBe(false);
      expect(permissions.canViewProgramHistory).toBe(true);
    }
  });

  it("grants owner/admin restore on archived records", () => {
    for (const role of ["owner", "admin"] as const) {
      const permissions = resolveProgramPermissions(role, { isArchived: true });
      expect(permissions.canRestoreProgram).toBe(true);
      expect(permissions.canUpdateProgram).toBe(false);
      expect(permissions.canArchiveProgram).toBe(false);
      expect(permissions.canTransitionProgramStatus).toBe(false);
    }
  });

  it("keeps staff and viewer read-only for programs", () => {
    for (const role of ["staff", "viewer"] as const) {
      const permissions = resolveProgramPermissions(role, { isArchived: false });
      expect(permissions.canListPrograms).toBe(true);
      expect(permissions.canViewProgram).toBe(true);
      expect(permissions.canCreateProgram).toBe(false);
      expect(permissions.canUpdateProgram).toBe(false);
      expect(permissions.canTransitionProgramStatus).toBe(false);
      expect(permissions.canArchiveProgram).toBe(false);
      expect(permissions.canRestoreProgram).toBe(false);
      expect(permissions.canViewArchivedPrograms).toBe(false);
    }
  });

  it("denies staff/viewer archived record access", () => {
    for (const role of ["staff", "viewer"] as const) {
      const permissions = resolveProgramPermissions(role, { isArchived: true });
      expect(permissions.canViewProgram).toBe(false);
      expect(permissions.canListPrograms).toBe(false);
      expect(permissions.canViewProgramHistory).toBe(false);
    }
  });

  it("fails closed for unknown or absent roles", () => {
    expect(resolveProgramPermissions(null).canViewProgram).toBe(false);
    expect(resolveProgramPermissions(undefined).canCreateProgram).toBe(false);
    expect(
      resolveProgramPermissions("superuser" as never).canListPrograms,
    ).toBe(false);
  });
});
