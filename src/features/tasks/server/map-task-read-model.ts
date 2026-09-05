import { deriveTaskFlags } from "@/features/tasks/domain/due-state";
import type {
  TaskHistoryReadEntry,
  TaskListItemReadModel,
  TaskReadModel,
} from "@/features/tasks/domain/read-types";
import type {
  TaskLinkedContext,
  TaskRow,
  TaskSourceType,
  TaskStatus,
  TaskStatusHistoryRow,
} from "@/features/tasks/domain/types";

export type TaskListRow = Pick<
  TaskRow,
  | "id"
  | "organization_id"
  | "title"
  | "status"
  | "task_type"
  | "priority"
  | "source"
  | "due_at"
  | "assignee_member_id"
  | "lead_id"
  | "customer_id"
  | "enrollment_id"
  | "program_id"
  | "project_id"
  | "archived_at"
  | "created_at"
>;

export type TaskDetailRow = TaskRow;

function isTaskStatus(value: string): value is TaskStatus {
  return value === "open" || value === "completed" || value === "cancelled";
}

function isTaskSourceType(value: string): value is TaskSourceType {
  return value === "manual" || value === "system";
}

export function mapLinkedContext(row: Pick<
  TaskRow,
  "lead_id" | "customer_id" | "enrollment_id" | "program_id"
> & { project_id?: string | null }): TaskLinkedContext {
  if (row.project_id) {
    return { kind: "project", projectId: row.project_id };
  }

  if (row.lead_id) {
    return { kind: "lead", leadId: row.lead_id };
  }

  if (row.enrollment_id && row.customer_id && row.program_id) {
    return {
      kind: "enrollment",
      enrollmentId: row.enrollment_id,
      customerId: row.customer_id,
      programId: row.program_id,
    };
  }

  if (row.customer_id) {
    return { kind: "customer", customerId: row.customer_id };
  }

  throw new Error("Task row is missing a valid linked context");
}

export function mapTaskListItem(
  row: TaskListRow,
  timeZone: string,
  now?: Date,
): TaskListItemReadModel {
  const status = isTaskStatus(row.status) ? row.status : "open";
  const source = isTaskSourceType(row.source) ? row.source : "manual";

  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    status,
    taskType: row.task_type as TaskListItemReadModel["taskType"],
    priority: row.priority as TaskListItemReadModel["priority"],
    source,
    dueAt: row.due_at,
    assigneeMemberId: row.assignee_member_id,
    linkedContext: mapLinkedContext(row),
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    derived: deriveTaskFlags({
      status,
      dueAt: row.due_at,
      archivedAt: row.archived_at,
      timeZone,
      now,
    }),
  };
}

export function mapTaskDetail(
  row: TaskDetailRow,
  timeZone: string,
  now?: Date,
): TaskReadModel {
  const status = isTaskStatus(row.status) ? row.status : "open";
  const source = isTaskSourceType(row.source) ? row.source : "manual";

  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description,
    status,
    taskType: row.task_type as TaskReadModel["taskType"],
    priority: row.priority as TaskReadModel["priority"],
    source,
    dueAt: row.due_at,
    assigneeMemberId: row.assignee_member_id,
    createdByMemberId: row.created_by_member_id,
    linkedContext: mapLinkedContext(row),
    predecessorTaskId: row.predecessor_task_id,
    archivedAt: row.archived_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    derived: deriveTaskFlags({
      status,
      dueAt: row.due_at,
      archivedAt: row.archived_at,
      timeZone,
      now,
    }),
  };
}

export function mapTaskHistoryEntry(row: TaskStatusHistoryRow): TaskHistoryReadEntry {
  const fromStatus =
    row.from_status && isTaskStatus(row.from_status) ? row.from_status : null;
  const toStatus = isTaskStatus(row.to_status) ? row.to_status : "open";
  const source = isTaskSourceType(row.source) ? row.source : "manual";

  return {
    id: row.id,
    organizationId: row.organization_id,
    taskId: row.task_id,
    fromStatus,
    toStatus,
    changedByMemberId: row.changed_by_member_id,
    reason: row.reason,
    source,
    createdAt: row.created_at,
  };
}
