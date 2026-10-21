import { describe, expect, it } from "vitest";
import {
  isKnownEnrollmentRole,
  resolveEnrollmentPermissions,
} from "@/features/enrollments/domain/permissions";
import { EMPTY_ENROLLMENT_PERMISSIONS } from "@/features/enrollments/domain/types";

describe("resolveEnrollmentPermissions", () => {
  it("grants owner/admin full non-archived capabilities except restore", () => {
    for (const role of ["owner", "admin"] as const) {
      const permissions = resolveEnrollmentPermissions(role, { isArchived: false });
      expect(permissions.canListEnrollments).toBe(true);
      expect(permissions.canViewEnrollment).toBe(true);
      expect(permissions.canViewArchivedEnrollments).toBe(true);
      expect(permissions.canCreateEnrollment).toBe(true);
      expect(permissions.canUpdateOwnerOrMetadata).toBe(true);
      expect(permissions.canTransitionEnrollmentStatus).toBe(true);
      expect(permissions.canArchiveEnrollment).toBe(true);
      expect(permissions.canRestoreEnrollment).toBe(false);
      expect(permissions.canViewEnrollmentHistory).toBe(true);
    }
  });

  it("grants owner/admin restore on archived records while other mutations lock", () => {
    for (const role of ["owner", "admin"] as const) {
      const permissions = resolveEnrollmentPermissions(role, { isArchived: true });
      expect(permissions.canRestoreEnrollment).toBe(true);
      expect(permissions.canUpdateOwnerOrMetadata).toBe(false);
      expect(permissions.canTransitionEnrollmentStatus).toBe(false);
      expect(permissions.canArchiveEnrollment).toBe(false);
      expect(permissions.canViewArchivedEnrollments).toBe(true);
      expect(permissions.canViewEnrollment).toBe(true);
    }
  });

  it("allows staff to create/update/transition non-archived enrollments but never archive or restore", () => {
    const permissions = resolveEnrollmentPermissions("staff", { isArchived: false });
    expect(permissions.canListEnrollments).toBe(true);
    expect(permissions.canViewEnrollment).toBe(true);
    expect(permissions.canCreateEnrollment).toBe(true);
    expect(permissions.canUpdateOwnerOrMetadata).toBe(true);
    expect(permissions.canTransitionEnrollmentStatus).toBe(true);
    expect(permissions.canArchiveEnrollment).toBe(false);
    expect(permissions.canRestoreEnrollment).toBe(false);
    expect(permissions.canViewArchivedEnrollments).toBe(false);
  });

  it("denies staff visibility into archived enrollments", () => {
    const permissions = resolveEnrollmentPermissions("staff", { isArchived: true });
    expect(permissions.canViewEnrollment).toBe(false);
    expect(permissions.canListEnrollments).toBe(false);
    expect(permissions.canViewEnrollmentHistory).toBe(false);
    expect(permissions.canViewArchivedEnrollments).toBe(false);
    expect(permissions.canCreateEnrollment).toBe(false);
    expect(permissions.canUpdateOwnerOrMetadata).toBe(false);
    expect(permissions.canTransitionEnrollmentStatus).toBe(false);
    expect(permissions.canArchiveEnrollment).toBe(false);
    expect(permissions.canRestoreEnrollment).toBe(false);
  });

  it("keeps viewer read-only for non-archived enrollments with no mutation rights", () => {
    const permissions = resolveEnrollmentPermissions("viewer", { isArchived: false });
    expect(permissions.canListEnrollments).toBe(true);
    expect(permissions.canViewEnrollment).toBe(true);
    expect(permissions.canViewEnrollmentHistory).toBe(true);
    expect(permissions.canViewArchivedEnrollments).toBe(false);
    expect(permissions.canCreateEnrollment).toBe(false);
    expect(permissions.canUpdateOwnerOrMetadata).toBe(false);
    expect(permissions.canTransitionEnrollmentStatus).toBe(false);
    expect(permissions.canArchiveEnrollment).toBe(false);
    expect(permissions.canRestoreEnrollment).toBe(false);
  });

  it("denies viewer any access to archived enrollments", () => {
    const permissions = resolveEnrollmentPermissions("viewer", { isArchived: true });
    expect(permissions.canViewEnrollment).toBe(false);
    expect(permissions.canListEnrollments).toBe(false);
    expect(permissions.canViewEnrollmentHistory).toBe(false);
    expect(permissions.canViewArchivedEnrollments).toBe(false);
    expect(permissions.canRestoreEnrollment).toBe(false);
  });

  it("fails closed for unknown, null, or undefined roles", () => {
    expect(resolveEnrollmentPermissions(null)).toEqual(EMPTY_ENROLLMENT_PERMISSIONS);
    expect(resolveEnrollmentPermissions(undefined)).toEqual(EMPTY_ENROLLMENT_PERMISSIONS);
    expect(resolveEnrollmentPermissions("superuser" as never)).toEqual(
      EMPTY_ENROLLMENT_PERMISSIONS,
    );
    expect(
      resolveEnrollmentPermissions("superuser" as never, { isArchived: true }),
    ).toEqual(EMPTY_ENROLLMENT_PERMISSIONS);
  });

  it("recognizes exactly the known enrollment roles", () => {
    expect(isKnownEnrollmentRole("owner")).toBe(true);
    expect(isKnownEnrollmentRole("admin")).toBe(true);
    expect(isKnownEnrollmentRole("staff")).toBe(true);
    expect(isKnownEnrollmentRole("viewer")).toBe(true);
    expect(isKnownEnrollmentRole("superuser")).toBe(false);
    expect(isKnownEnrollmentRole("")).toBe(false);
  });
});
