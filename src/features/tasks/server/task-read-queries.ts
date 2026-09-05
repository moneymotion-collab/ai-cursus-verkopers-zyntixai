import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { resolveOrganizationTimezone } from "@/features/organizations/server/resolve-organization-timezone";
import { getUtcBoundsForOrgCalendarDay } from "@/features/tasks/domain/due-state";
import { resolveTaskPermissions } from "@/features/tasks/domain/permissions";
import type {
  TaskHistoryReadEntry,
  TaskListFilters,
  TaskListReadResult,
  TaskPaginationInput,
  TaskReadModel,
  TaskReadQueryResult,
  TaskSortInput,
} from "@/features/tasks/domain/read-types";
import {
  mapTaskDetail,
  mapTaskHistoryEntry,
  mapTaskListItem,
  type TaskDetailRow,
  type TaskListRow,
} from "@/features/tasks/server/map-task-read-model";
import {
  invalidQueryError,
  normalizeTaskError,
  permissionDeniedError,
  taskNotFoundError,
  zodErrorToFieldMap,
} from "@/features/tasks/server/normalize-task-error";
import {
  TASK_DETAIL_SELECT_COLUMNS,
  TASK_HISTORY_SELECT_COLUMNS,
  TASK_LIST_SELECT_COLUMNS,
} from "@/features/tasks/server/task-query-columns";
import {
  normalizePagination,
  validateTaskHistoryQuery,
  validateTaskIdQuery,
  validateTaskListQuery,
} from "@/features/tasks/validation/read-query-schemas";

type ListTasksParams = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  filters?: TaskListFilters;
  pagination?: TaskPaginationInput;
  sort?: TaskSortInput;
};

type TaskByIdParams = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  taskId: string;
};

type ContextualListParams = Omit<ListTasksParams, "filters"> & {
  filters?: Omit<
    TaskListFilters,
    "leadId" | "customerId" | "enrollmentId" | "projectId" | "assigneeMemberId"
  >;
};

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

function buildPaginationMeta(
  page: number,
  pageSize: number,
  totalCount: number,
): TaskListReadResult["pagination"] {
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

type TasksListQuery = ReturnType<
  ReturnType<SupabaseClient<Database>["from"]>["select"]
>;

function applyListFilters(
  query: TasksListQuery,
  filters: TaskListFilters,
  organizationId: string,
  timeZone: string,
  now: Date,
): TasksListQuery {
  let nextQuery = query.eq("organization_id", organizationId);

  if (!filters.includeArchived) {
    nextQuery = nextQuery.is("archived_at", null);
  }

  if (filters.status) {
    nextQuery = Array.isArray(filters.status)
      ? nextQuery.in("status", filters.status)
      : nextQuery.eq("status", filters.status);
  } else {
    nextQuery = nextQuery.eq("status", "open");
  }

  if (filters.assigneeMemberId) {
    nextQuery = nextQuery.eq("assignee_member_id", filters.assigneeMemberId);
  }

  if (filters.leadId) {
    nextQuery = nextQuery.eq("lead_id", filters.leadId);
  }

  if (filters.customerId) {
    nextQuery = nextQuery.eq("customer_id", filters.customerId);
  }

  if (filters.enrollmentId) {
    nextQuery = nextQuery.eq("enrollment_id", filters.enrollmentId);
  }

  if (filters.programId) {
    nextQuery = nextQuery.eq("program_id", filters.programId);
  }

  if (filters.projectId) {
    nextQuery = nextQuery.eq("project_id", filters.projectId);
  }

  if (filters.source) {
    nextQuery = nextQuery.eq("source", filters.source);
  }

  if (filters.search) {
    nextQuery = nextQuery.ilike("title", `%${escapeIlikePattern(filters.search)}%`);
  }

  if (filters.dueState === "overdue") {
    nextQuery = nextQuery.eq("status", "open").lt("due_at", now.toISOString());
  } else if (filters.dueState === "due_today" || filters.dueState === "upcoming") {
    const bounds = getUtcBoundsForOrgCalendarDay(timeZone, now);
    if (bounds) {
      nextQuery = nextQuery.eq("status", "open");
      if (filters.dueState === "due_today") {
        nextQuery = nextQuery
          .gte("due_at", bounds.start.toISOString())
          .lte("due_at", bounds.end.toISOString());
      } else {
        nextQuery = nextQuery.gt("due_at", bounds.end.toISOString());
      }
    }
  } else if (filters.dueState === "none") {
    nextQuery = nextQuery.in("status", ["completed", "cancelled"]);
  }

  return nextQuery;
}

function applySort(query: TasksListQuery, sort: TaskSortInput): TasksListQuery {
  const field = sort.field ?? "due_at";
  const direction = sort.direction ?? "asc";
  const ascending = direction === "asc";

  let nextQuery = query.order(field, { ascending, nullsFirst: false });

  if (field !== "created_at") {
    nextQuery = nextQuery.order("created_at", { ascending: true });
  }

  return nextQuery.order("id", { ascending: true });
}

async function ensureReadAccess(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<
  | { ok: true; timeZone: string }
  | { ok: false; error: import("@/features/tasks/domain/types").TaskApplicationError }
> {
  const orgResult = await resolveOrganizationContext({ supabase, organizationId });
  if (!orgResult.ok) {
    return orgResult;
  }

  const permissions = resolveTaskPermissions(orgResult.context.role);
  if (!permissions.canViewTasks) {
    return { ok: false, error: permissionDeniedError() };
  }

  const timezoneResult = await resolveOrganizationTimezone(supabase, organizationId);
  if (!timezoneResult.ok) {
    return timezoneResult;
  }

  return { ok: true, timeZone: timezoneResult.timezone };
}

export async function listTasks(
  params: ListTasksParams,
): Promise<TaskReadQueryResult<TaskListReadResult>> {
  const parsed = validateTaskListQuery({
    organizationId: params.organizationId,
    filters: params.filters ?? {},
    pagination: params.pagination ?? {},
    sort: params.sort ?? {},
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidQueryError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const access = await ensureReadAccess(params.supabase, parsed.data.organizationId);
  if (!access.ok) {
    return access;
  }

  const { page, pageSize, offset, limit } = normalizePagination(parsed.data.pagination);
  const now = new Date();

  let query = params.supabase
    .from("tasks")
    .select(TASK_LIST_SELECT_COLUMNS, { count: "exact" });

  query = applyListFilters(
    query,
    parsed.data.filters,
    parsed.data.organizationId,
    access.timeZone,
    now,
  );
  query = applySort(query, parsed.data.sort);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return { ok: false, error: normalizeTaskError(error) };
  }

  const rows = (data ?? []) as unknown as TaskListRow[];
  const totalCount = count ?? rows.length;

  return {
    ok: true,
    data: {
      items: rows.map((row) => mapTaskListItem(row, access.timeZone, now)),
      pagination: buildPaginationMeta(page, pageSize, totalCount),
    },
  };
}

export async function getTaskById(
  params: TaskByIdParams,
): Promise<TaskReadQueryResult<TaskReadModel>> {
  const parsed = validateTaskIdQuery({
    organizationId: params.organizationId,
    taskId: params.taskId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidQueryError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const access = await ensureReadAccess(params.supabase, parsed.data.organizationId);
  if (!access.ok) {
    return access;
  }

  const now = new Date();
  const { data, error } = await params.supabase
    .from("tasks")
    .select(TASK_DETAIL_SELECT_COLUMNS)
    .eq("id", parsed.data.taskId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: normalizeTaskError(error) };
  }

  if (!data) {
    return { ok: false, error: taskNotFoundError() };
  }

  return {
    ok: true,
    data: mapTaskDetail(data as unknown as TaskDetailRow, access.timeZone, now),
  };
}

export async function listTasksForLead(
  params: ContextualListParams & { leadId: string },
): Promise<TaskReadQueryResult<TaskListReadResult>> {
  return listTasks({
    ...params,
    filters: { ...params.filters, leadId: params.leadId },
  });
}

export async function listTasksForCustomer(
  params: ContextualListParams & { customerId: string },
): Promise<TaskReadQueryResult<TaskListReadResult>> {
  return listTasks({
    ...params,
    filters: { ...params.filters, customerId: params.customerId },
  });
}

export async function listTasksForEnrollment(
  params: ContextualListParams & { enrollmentId: string },
): Promise<TaskReadQueryResult<TaskListReadResult>> {
  return listTasks({
    ...params,
    filters: { ...params.filters, enrollmentId: params.enrollmentId },
  });
}

export async function listTasksForProject(
  params: ContextualListParams & { projectId: string },
): Promise<TaskReadQueryResult<TaskListReadResult>> {
  return listTasks({
    ...params,
    filters: { ...params.filters, projectId: params.projectId },
  });
}

export async function listTasksForAssignee(
  params: ContextualListParams & { assigneeMemberId: string },
): Promise<TaskReadQueryResult<TaskListReadResult>> {
  return listTasks({
    ...params,
    filters: { ...params.filters, assigneeMemberId: params.assigneeMemberId },
  });
}

export async function getTaskStatusHistory(
  params: TaskByIdParams,
): Promise<TaskReadQueryResult<TaskHistoryReadEntry[]>> {
  const parsed = validateTaskHistoryQuery({
    organizationId: params.organizationId,
    taskId: params.taskId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidQueryError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const orgResult = await resolveOrganizationContext({
    supabase: params.supabase,
    organizationId: parsed.data.organizationId,
  });

  if (!orgResult.ok) {
    return orgResult;
  }

  const permissions = resolveTaskPermissions(orgResult.context.role);
  if (!permissions.canViewTaskHistory) {
    return { ok: false, error: permissionDeniedError() };
  }

  const taskCheck = await params.supabase
    .from("tasks")
    .select("id")
    .eq("id", parsed.data.taskId)
    .maybeSingle();

  if (taskCheck.error) {
    return { ok: false, error: normalizeTaskError(taskCheck.error) };
  }

  if (!taskCheck.data) {
    return { ok: false, error: taskNotFoundError() };
  }

  const { data, error } = await params.supabase
    .from("task_status_history")
    .select(TASK_HISTORY_SELECT_COLUMNS)
    .eq("task_id", parsed.data.taskId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    return { ok: false, error: normalizeTaskError(error) };
  }

  return {
    ok: true,
    data: (data ?? []).map(mapTaskHistoryEntry),
  };
}

/**
 * Minimal integration consumer for server-side task reads.
 * Intended for tests and bounded diagnostics — not a public UI surface.
 */
export async function consumeTaskReadSummary(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<
  TaskReadQueryResult<{
    openTaskCount: number;
    sampleTaskId: string | null;
  }>
> {
  const result = await listTasks({
    supabase,
    organizationId,
    filters: { status: "open", includeArchived: false },
    pagination: { page: 1, pageSize: 1 },
  });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: {
      openTaskCount: result.data.pagination.totalCount,
      sampleTaskId: result.data.items[0]?.id ?? null,
    },
  };
}
