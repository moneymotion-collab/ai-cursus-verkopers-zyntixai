import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import type {
  TaskListFilters,
  TaskPaginationInput,
  TaskSortInput,
} from "@/features/tasks/domain/read-types";
import {
  DEFAULT_TASK_PAGE_SIZE,
  MAX_TASK_PAGE_SIZE,
} from "@/features/tasks/domain/read-types";
import type { TaskSourceType } from "@/features/tasks/domain/types";
import { TASK_SOURCES, TASK_STATUSES } from "@/features/tasks/domain/types";

export type TaskListViewStatus = "open" | "completed" | "cancelled" | "all";

export type TaskListUrlState = {
  org?: string;
  status: TaskListViewStatus;
  dueState?: "overdue" | "due_today" | "upcoming";
  source?: TaskSourceType;
  assignee?: string;
  q?: string;
  archived: boolean;
  page: number;
  pageSize: number;
};

export type ParsedTaskListSearchParams = {
  urlState: TaskListUrlState;
  listInput: {
    filters: TaskListFilters;
    pagination: TaskPaginationInput;
    sort: TaskSortInput;
  };
  warnings: string[];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parsePositiveInt(value: string | undefined, fallback: number, max: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
}

function parseViewStatus(value: string | undefined): TaskListViewStatus {
  if (!value || value === "open") {
    return "open";
  }
  if (value === "all") {
    return "all";
  }
  if ((TASK_STATUSES as readonly string[]).includes(value)) {
    return value as TaskListViewStatus;
  }
  return "open";
}

function parseDueState(
  value: string | undefined,
): "overdue" | "due_today" | "upcoming" | undefined {
  if (value === "overdue" || value === "due_today" || value === "upcoming") {
    return value;
  }
  return undefined;
}

function parseSource(value: string | undefined): TaskSourceType | undefined {
  if (value && (TASK_SOURCES as readonly string[]).includes(value)) {
    return value as TaskSourceType;
  }
  return undefined;
}

function statusToFilters(status: TaskListViewStatus): Pick<TaskListFilters, "status"> {
  if (status === "all") {
    return { status: ["open", "completed", "cancelled"] };
  }
  return { status };
}

export function canViewArchivedFilter(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function parseTaskListSearchParams(
  raw: Record<string, string | string[] | undefined>,
  options: { role: OrganizationRole; assigneeOptions?: string[] },
): ParsedTaskListSearchParams {
  const warnings: string[] = [];
  const orgRaw = firstValue(raw.org);
  const org = orgRaw && UUID_PATTERN.test(orgRaw) ? orgRaw : undefined;
  if (orgRaw && !org) {
    warnings.push("invalid_org");
  }

  const statusRaw = firstValue(raw.status);
  const status = parseViewStatus(statusRaw);
  if (statusRaw && statusRaw !== status && statusRaw !== "open") {
    warnings.push("invalid_status");
  }

  const dueState = parseDueState(firstValue(raw.dueState));
  if (firstValue(raw.dueState) && !dueState) {
    warnings.push("invalid_due_state");
  }

  const source = parseSource(firstValue(raw.source));
  if (firstValue(raw.source) && !source) {
    warnings.push("invalid_source");
  }

  const qRaw = firstValue(raw.q)?.trim();
  const q = qRaw && qRaw.length > 0 ? qRaw.slice(0, 200) : undefined;

  const assigneeRaw = firstValue(raw.assignee);
  const assigneeCandidate = assigneeRaw && UUID_PATTERN.test(assigneeRaw) ? assigneeRaw : undefined;
  let assignee: string | undefined;
  if (assigneeCandidate) {
    if (options.assigneeOptions) {
      assignee = options.assigneeOptions.includes(assigneeCandidate) ? assigneeCandidate : undefined;
      if (!assignee) {
        warnings.push("invalid_assignee");
      }
    } else {
      assignee = assigneeCandidate;
    }
  }
  if (assigneeRaw && !assigneeCandidate) {
    warnings.push("invalid_assignee");
  }

  const archivedRequested = firstValue(raw.archived) === "true";
  const archived =
    archivedRequested && canViewArchivedFilter(options.role) ? true : false;
  if (archivedRequested && !archived) {
    warnings.push("archived_not_allowed");
  }

  const page = parsePositiveInt(firstValue(raw.page), 1, Number.MAX_SAFE_INTEGER);
  const pageSize = parsePositiveInt(
    firstValue(raw.pageSize),
    DEFAULT_TASK_PAGE_SIZE,
    MAX_TASK_PAGE_SIZE,
  );

  const urlState: TaskListUrlState = {
    org,
    status,
    dueState,
    source,
    assignee,
    q,
    archived,
    page,
    pageSize,
  };

  const filters: TaskListFilters = {
    ...statusToFilters(status),
    includeArchived: archived,
    dueState,
    source,
    assigneeMemberId: assignee,
    search: q,
  };

  if (archived && status === "open") {
    filters.status = ["completed", "cancelled"];
  }

  return {
    urlState,
    listInput: {
      filters,
      pagination: { page, pageSize },
      sort: { field: "due_at", direction: "asc" },
    },
    warnings,
  };
}

export function buildTaskListQueryString(state: TaskListUrlState): string {
  const params = new URLSearchParams();
  if (state.org) {
    params.set("org", state.org);
  }
  if (state.status !== "open") {
    params.set("status", state.status);
  }
  if (state.dueState) {
    params.set("dueState", state.dueState);
  }
  if (state.source) {
    params.set("source", state.source);
  }
  if (state.assignee) {
    params.set("assignee", state.assignee);
  }
  if (state.q) {
    params.set("q", state.q);
  }
  if (state.archived) {
    params.set("archived", "true");
  }
  if (state.page > 1) {
    params.set("page", String(state.page));
  }
  if (state.pageSize !== DEFAULT_TASK_PAGE_SIZE) {
    params.set("pageSize", String(state.pageSize));
  }
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export function mergeUrlState(
  current: TaskListUrlState,
  patch: Partial<TaskListUrlState>,
): TaskListUrlState {
  return {
    ...current,
    ...patch,
    page: patch.page ?? (patch.status || patch.dueState || patch.assignee !== undefined || patch.q !== undefined ? 1 : current.page),
  };
}
