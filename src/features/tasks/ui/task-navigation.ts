import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import {
  buildTaskListQueryString,
  parseTaskListSearchParams,
  type TaskListUrlState,
} from "@/features/tasks/ui/task-list-search-params";

export function parseListReturnState(
  raw: Record<string, string | string[] | undefined>,
  role: OrganizationRole,
): TaskListUrlState {
  return parseTaskListSearchParams(raw, { role }).urlState;
}

export function buildBackToTasksHref(listState: TaskListUrlState): string {
  return `/tasks${buildTaskListQueryString(listState)}`;
}

export function buildTaskDetailHref(taskId: string, listState: TaskListUrlState): string {
  const query = buildTaskListQueryString(listState);
  return `/tasks/${taskId}${query}`;
}

export function buildTaskCreateHref(listState: TaskListUrlState): string {
  return `/tasks/new${buildTaskListQueryString(listState)}`;
}

export function buildTaskEditHref(taskId: string, listState: TaskListUrlState): string {
  return `/tasks/${taskId}/edit${buildTaskListQueryString(listState)}`;
}

export function buildTaskReassignHref(taskId: string, listState: TaskListUrlState): string {
  return `/tasks/${taskId}/reassign${buildTaskListQueryString(listState)}`;
}

export function buildTaskRescheduleHref(taskId: string, listState: TaskListUrlState): string {
  return `/tasks/${taskId}/reschedule${buildTaskListQueryString(listState)}`;
}

export function buildTaskCompleteHref(taskId: string, listState: TaskListUrlState): string {
  return `/tasks/${taskId}/complete${buildTaskListQueryString(listState)}`;
}

export function buildTaskCancelHref(taskId: string, listState: TaskListUrlState): string {
  return `/tasks/${taskId}/cancel${buildTaskListQueryString(listState)}`;
}

export function buildTaskArchiveHref(taskId: string, listState: TaskListUrlState): string {
  return `/tasks/${taskId}/archive${buildTaskListQueryString(listState)}`;
}

export function buildTaskRestoreHref(taskId: string, listState: TaskListUrlState): string {
  return `/tasks/${taskId}/restore${buildTaskListQueryString(listState)}`;
}
