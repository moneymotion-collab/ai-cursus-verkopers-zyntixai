import type { Json, Tables } from "@/types/database";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";

export type TaskRow = Tables<"tasks">;
export type TaskStatusHistoryRow = Tables<"task_status_history">;

export type TaskStatus = "open" | "completed" | "cancelled";
export type TaskPriority = "low" | "normal" | "high";
export type TaskSourceType = "manual" | "system";
export type TaskType = "follow_up" | "call_prep" | "onboarding" | "general";

export type TaskLinkedContext =
  | { kind: "lead"; leadId: string }
  | { kind: "customer"; customerId: string }
  | { kind: "project"; projectId: string }
  | {
      kind: "enrollment";
      enrollmentId: string;
      customerId: string;
      programId: string;
    };

export type Task = TaskRow;

export type TaskStatusHistoryEntry = TaskStatusHistoryRow;

export type TaskPermissionSet = {
  canViewTasks: boolean;
  canViewArchivedTasks: boolean;
  canViewTaskHistory: boolean;
  canCreateTask: boolean;
  canCreateSystemTask: boolean;
  canEditTask: boolean;
  canReassignTask: boolean;
  canRescheduleTask: boolean;
  canCompleteTask: boolean;
  canCancelTask: boolean;
  canArchiveTask: boolean;
  canRestoreTask: boolean;
};

export type TaskApplicationErrorCode =
  | "AUTH_REQUIRED"
  | "SESSION_EXPIRED"
  | "INSUFFICIENT_ROLE"
  | "PERMISSION_DENIED"
  | "TASK_NOT_FOUND"
  | "ORG_CONTEXT_MISSING"
  | "INVALID_LINKED_CONTEXT"
  | "CONFLICTING_LINKED_CONTEXT"
  | "DUE_DATE_REQUIRED"
  | "INVALID_ASSIGNEE"
  | "LINKED_ENTITY_ARCHIVED"
  | "INVALID_STATE_TRANSITION"
  | "TASK_ALREADY_TERMINAL"
  | "PREDECESSOR_IMMUTABLE"
  | "PREDECESSOR_CYCLE"
  | "INVALID_PREDECESSOR"
  | "IDEMPOTENCY_CONFLICT"
  | "VALIDATION_ERROR"
  | "MALFORMED_INPUT"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "DATABASE_UNAVAILABLE"
  | "MUTATION_COMMITTED_REFRESH_REQUIRED"
  | "UNEXPECTED_ERROR";

export type TaskApplicationError = {
  code: TaskApplicationErrorCode;
  message: string;
  retryable: boolean;
  category: "auth" | "permission" | "validation" | "not_found" | "conflict" | "network" | "server";
  fieldErrors?: Record<string, string>;
  cause?: string;
  refreshRequired?: boolean;
};

/** D4.1 RPC adapter result — unchanged contract for adapter layer. */
export type TaskRpcAdapterResult =
  | { ok: true; taskId?: string }
  | { ok: false; error: TaskApplicationError };

export type TaskMutationRefreshHints = {
  task: true;
  taskLists: true;
  taskHistory: boolean;
};

export type TaskMutationSuccess = {
  ok: true;
  taskId: string;
  task: TaskReadModel;
  committed: true;
  refreshRequired: false;
  refreshHints: TaskMutationRefreshHints;
};

export type TaskMutationFailure = {
  ok: false;
  committed: false;
  error: TaskApplicationError;
};

export type TaskMutationCommittedRefreshFailure = {
  ok: false;
  committed: true;
  taskId: string;
  refreshHints: TaskMutationRefreshHints;
  error: TaskApplicationError & {
    refreshRequired: true;
    retryable: false;
  };
};

export type TaskMutationResult =
  | TaskMutationSuccess
  | TaskMutationFailure
  | TaskMutationCommittedRefreshFailure;

export type TaskCreateInput = {
  title: string;
  dueAt: string;
  description?: string | null;
  taskType?: TaskType;
  priority?: TaskPriority;
  source?: TaskSourceType;
  assigneeMemberId?: string | null;
  leadId?: string | null;
  customerId?: string | null;
  enrollmentId?: string | null;
  programId?: string | null;
  projectId?: string | null;
  predecessorTaskId?: string | null;
  idempotencyKey?: string | null;
  metadata?: Json;
};

export type TaskUpdateInput = {
  taskId: string;
  title: string;
  description?: string | null;
  taskType?: TaskType;
  priority?: TaskPriority;
  metadata?: Json;
};

export type TaskReassignInput = {
  taskId: string;
  assigneeMemberId?: string | null;
};

export type TaskRescheduleInput = {
  taskId: string;
  dueAt: string;
};

export type TaskCompleteInput = {
  taskId: string;
  completionNote?: string | null;
};

export type TaskCancelInput = {
  taskId: string;
  cancelReason: string;
};

export type TaskArchiveInput = {
  taskId: string;
};

export type TaskRestoreInput = {
  taskId: string;
};

export type OrganizationContextRequest = {
  organizationId: string;
};

export const TASK_STATUSES = ["open", "completed", "cancelled"] as const;
export const TASK_PRIORITIES = ["low", "normal", "high"] as const;
export const TASK_SOURCES = ["manual", "system"] as const;
export const TASK_TYPES = ["follow_up", "call_prep", "onboarding", "general"] as const;

export const EMPTY_TASK_PERMISSIONS: TaskPermissionSet = {
  canViewTasks: false,
  canViewArchivedTasks: false,
  canViewTaskHistory: false,
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
