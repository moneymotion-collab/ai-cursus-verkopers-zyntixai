import type {
  EnrollmentPermissionSet,
  EnrollmentRole,
} from "@/features/enrollments/domain/types";
import { EMPTY_ENROLLMENT_PERMISSIONS } from "@/features/enrollments/domain/types";

const KNOWN_ROLES: readonly EnrollmentRole[] = [
  "owner",
  "admin",
  "staff",
  "viewer",
];

export function isKnownEnrollmentRole(role: string): role is EnrollmentRole {
  return (KNOWN_ROLES as readonly string[]).includes(role);
}

export type EnrollmentPermissionContext = {
  isArchived?: boolean;
};

/**
 * Pure UI/server convenience hints derived from proven Enrollment RPC + RLS behavior.
 * Database authorization remains authoritative.
 *
 * Proven matrix:
 * - List/view non-archived: all members
 * - View archived: owner/admin only (admin SELECT)
 * - Create / transition / owner-metadata update: owner/admin/staff
 * - Archive / restore: owner/admin only; terminal statuses only (DB)
 * - Viewer: read non-archived only
 */
export function resolveEnrollmentPermissions(
  role: EnrollmentRole | null | undefined,
  context: EnrollmentPermissionContext = {},
): EnrollmentPermissionSet {
  if (!role) {
    return { ...EMPTY_ENROLLMENT_PERMISSIONS };
  }

  const isArchived = context.isArchived === true;

  switch (role) {
    case "owner":
    case "admin":
      return {
        canListEnrollments: true,
        canViewEnrollment: true,
        canViewArchivedEnrollments: true,
        canCreateEnrollment: true,
        canUpdateOwnerOrMetadata: !isArchived,
        canTransitionEnrollmentStatus: !isArchived,
        canArchiveEnrollment: !isArchived,
        canRestoreEnrollment: isArchived,
        canViewEnrollmentHistory: true,
      };
    case "staff":
      return {
        canListEnrollments: !isArchived,
        canViewEnrollment: !isArchived,
        canViewArchivedEnrollments: false,
        canCreateEnrollment: !isArchived,
        canUpdateOwnerOrMetadata: !isArchived,
        canTransitionEnrollmentStatus: !isArchived,
        canArchiveEnrollment: false,
        canRestoreEnrollment: false,
        canViewEnrollmentHistory: !isArchived,
      };
    case "viewer":
      return {
        canListEnrollments: !isArchived,
        canViewEnrollment: !isArchived,
        canViewArchivedEnrollments: false,
        canCreateEnrollment: false,
        canUpdateOwnerOrMetadata: false,
        canTransitionEnrollmentStatus: false,
        canArchiveEnrollment: false,
        canRestoreEnrollment: false,
        canViewEnrollmentHistory: !isArchived,
      };
    default:
      return { ...EMPTY_ENROLLMENT_PERMISSIONS };
  }
}
