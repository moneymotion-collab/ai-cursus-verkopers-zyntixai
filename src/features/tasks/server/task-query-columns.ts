export const TASK_LIST_SELECT_COLUMNS =
  "id, organization_id, title, status, task_type, priority, source, due_at, assignee_member_id, lead_id, customer_id, enrollment_id, program_id, project_id, archived_at, created_at" as const;

export const TASK_DETAIL_SELECT_COLUMNS =
  "id, organization_id, title, description, status, task_type, priority, source, due_at, assignee_member_id, created_by_member_id, lead_id, customer_id, enrollment_id, program_id, project_id, predecessor_task_id, archived_at, completed_at, cancelled_at, created_at, updated_at" as const;

export const TASK_HISTORY_SELECT_COLUMNS =
  "id, organization_id, task_id, from_status, to_status, changed_by_member_id, reason, source, created_at" as const;
