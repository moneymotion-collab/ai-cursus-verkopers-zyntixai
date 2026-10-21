import type { ProgramPermissionSet, ProgramRole } from "@/features/programs/domain/types";
import { EMPTY_PROGRAM_PERMISSIONS } from "@/features/programs/domain/types";

const KNOWN_ROLES: readonly ProgramRole[] = ["owner", "admin", "staff", "viewer"];

export function isKnownProgramRole(role: string): role is ProgramRole {
  return (KNOWN_ROLES as readonly string[]).includes(role);
}

export type ProgramPermissionContext = {
  isArchived?: boolean;
};

/**
 * Pure UI/server convenience hints derived from proven Program RPC + RLS behavior.
 * Database authorization remains authoritative.
 *
 * - Mutations: owner/admin only
 * - Staff/viewer: read non-archived only (member SELECT)
 * - Archived visibility: owner/admin only (admin SELECT)
 */
export function resolveProgramPermissions(
  role: ProgramRole | null | undefined,
  context: ProgramPermissionContext = {},
): ProgramPermissionSet {
  if (!role) {
    return { ...EMPTY_PROGRAM_PERMISSIONS };
  }

  const isArchived = context.isArchived === true;

  switch (role) {
    case "owner":
    case "admin":
      return {
        canListPrograms: true,
        canViewProgram: true,
        canViewArchivedPrograms: true,
        canCreateProgram: true,
        canUpdateProgram: !isArchived,
        canTransitionProgramStatus: !isArchived,
        canArchiveProgram: !isArchived,
        canRestoreProgram: isArchived,
        canViewProgramHistory: true,
      };
    case "staff":
    case "viewer":
      return {
        canListPrograms: !isArchived,
        canViewProgram: !isArchived,
        canViewArchivedPrograms: false,
        canCreateProgram: false,
        canUpdateProgram: false,
        canTransitionProgramStatus: false,
        canArchiveProgram: false,
        canRestoreProgram: false,
        canViewProgramHistory: !isArchived,
      };
    default:
      return { ...EMPTY_PROGRAM_PERMISSIONS };
  }
}
