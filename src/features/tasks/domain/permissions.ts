import type { TaskPermissionSet } from "@/features/tasks/domain/types";
import { EMPTY_TASK_PERMISSIONS } from "@/features/tasks/domain/types";

export type OrganizationRole = "owner" | "admin" | "staff" | "viewer";

export type MembershipStatus = "invited" | "active" | "suspended" | "removed";

const KNOWN_ROLES: readonly OrganizationRole[] = ["owner", "admin", "staff", "viewer"];

export function isKnownOrganizationRole(role: string): role is OrganizationRole {
  return (KNOWN_ROLES as readonly string[]).includes(role);
}

/**
 * Pure UI permission hints derived from verified D3 role behavior.
 * Database authorization remains authoritative.
 */
export function resolveTaskPermissions(
  role: OrganizationRole | null | undefined,
): TaskPermissionSet {
  if (!role) {
    return { ...EMPTY_TASK_PERMISSIONS };
  }

  switch (role) {
    case "owner":
    case "admin":
      return {
        canViewTasks: true,
        canViewArchivedTasks: true,
        canViewTaskHistory: true,
        canCreateTask: true,
        canCreateSystemTask: true,
        canEditTask: true,
        canReassignTask: true,
        canRescheduleTask: true,
        canCompleteTask: true,
        canCancelTask: true,
        canArchiveTask: true,
        canRestoreTask: true,
      };
    case "staff":
      return {
        canViewTasks: true,
        canViewArchivedTasks: false,
        canViewTaskHistory: true,
        canCreateTask: true,
        canCreateSystemTask: false,
        canEditTask: true,
        canReassignTask: true,
        canRescheduleTask: true,
        canCompleteTask: true,
        canCancelTask: true,
        canArchiveTask: false,
        canRestoreTask: false,
      };
    case "viewer":
      return {
        canViewTasks: true,
        canViewArchivedTasks: false,
        canViewTaskHistory: true,
        canCreateTask: false,
        canCreateSystemTask: false,
        canEditTask: false,
        canReassignTask: false,
        canRescheduleTask: false,
        canCompleteTask: false,
        canCancelTask: false,
        canArchiveTask: false,
        canRestoreTask: false,
      };
    default:
      return { ...EMPTY_TASK_PERMISSIONS };
  }
}
