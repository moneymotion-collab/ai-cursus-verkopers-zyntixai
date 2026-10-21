import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import { resolveTaskPermissions } from "@/features/tasks/domain/permissions";

type TaskWorkflowTarget = Pick<TaskReadModel, "status" | "derived">;

export function canShowCreateWorkflow(role: OrganizationRole): boolean {
  return resolveTaskPermissions(role).canCreateTask;
}

export function canShowEditWorkflow(task: TaskWorkflowTarget, role: OrganizationRole): boolean {
  const permissions = resolveTaskPermissions(role);
  return permissions.canEditTask && task.status === "open" && !task.derived.archived;
}

export function canShowReassignWorkflow(task: TaskWorkflowTarget, role: OrganizationRole): boolean {
  const permissions = resolveTaskPermissions(role);
  return permissions.canReassignTask && task.status === "open" && !task.derived.archived;
}

export function canShowRescheduleWorkflow(task: TaskWorkflowTarget, role: OrganizationRole): boolean {
  const permissions = resolveTaskPermissions(role);
  return permissions.canRescheduleTask && task.status === "open" && !task.derived.archived;
}

export function canShowCompleteWorkflow(task: TaskWorkflowTarget, role: OrganizationRole): boolean {
  const permissions = resolveTaskPermissions(role);
  return permissions.canCompleteTask && task.status === "open" && !task.derived.archived;
}

export function canShowCancelWorkflow(task: TaskWorkflowTarget, role: OrganizationRole): boolean {
  const permissions = resolveTaskPermissions(role);
  return permissions.canCancelTask && task.status === "open" && !task.derived.archived;
}

export function canShowArchiveWorkflow(task: TaskWorkflowTarget, role: OrganizationRole): boolean {
  const permissions = resolveTaskPermissions(role);
  return (
    permissions.canArchiveTask &&
    (task.status === "completed" || task.status === "cancelled") &&
    !task.derived.archived
  );
}

export function canShowRestoreWorkflow(task: TaskWorkflowTarget, role: OrganizationRole): boolean {
  const permissions = resolveTaskPermissions(role);
  return (
    permissions.canRestoreTask &&
    task.derived.archived &&
    (task.status === "completed" || task.status === "cancelled")
  );
}
