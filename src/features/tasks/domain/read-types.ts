import type {
  TaskLinkedContext,
  TaskPriority,
  TaskSourceType,
  TaskStatus,
  TaskType,
} from "@/features/tasks/domain/types";

export type TaskDueState = "overdue" | "due_today" | "upcoming" | "none";

export type TaskDerivedFlags = {
  terminal: boolean;
  archived: boolean;
  overdue: boolean;
  dueToday: boolean;
  upcoming: boolean;
  dueState: TaskDueState;
};

export type TaskReadModel = {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  taskType: TaskType;
  priority: TaskPriority;
  source: TaskSourceType;
  dueAt: string;
  assigneeMemberId: string | null;
  createdByMemberId: string;
  linkedContext: TaskLinkedContext;
  predecessorTaskId: string | null;
  archivedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  derived: TaskDerivedFlags;
};

export type TaskListItemReadModel = {
  id: string;
  organizationId: string;
  title: string;
  status: TaskStatus;
  taskType: TaskType;
  priority: TaskPriority;
  source: TaskSourceType;
  dueAt: string;
  assigneeMemberId: string | null;
  linkedContext: TaskLinkedContext;
  archivedAt: string | null;
  createdAt: string;
  derived: TaskDerivedFlags;
};

export type TaskHistoryReadEntry = {
  id: string;
  organizationId: string;
  taskId: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  changedByMemberId: string;
  reason: string | null;
  source: TaskSourceType;
  createdAt: string;
};

export type TaskListFilters = {
  status?: TaskStatus | TaskStatus[];
  includeArchived?: boolean;
  assigneeMemberId?: string;
  leadId?: string;
  customerId?: string;
  enrollmentId?: string;
  programId?: string;
  source?: TaskSourceType;
  dueState?: TaskDueState;
  search?: string;
};

export type TaskSortField = "due_at" | "created_at" | "title" | "priority";
export type TaskSortDirection = "asc" | "desc";

export type TaskSortInput = {
  field?: TaskSortField;
  direction?: TaskSortDirection;
};

export type TaskPaginationInput = {
  page?: number;
  pageSize?: number;
};

export type TaskPaginationMeta = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type TaskListReadResult = {
  items: TaskListItemReadModel[];
  pagination: TaskPaginationMeta;
};

export type TaskReadQueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: import("@/features/tasks/domain/types").TaskApplicationError };

export const DEFAULT_TASK_PAGE_SIZE = 25;
export const MAX_TASK_PAGE_SIZE = 100;
