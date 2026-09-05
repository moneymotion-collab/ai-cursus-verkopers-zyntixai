import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import type {
  TaskHistoryReadEntry,
} from "@/features/tasks/domain/read-types";
import type { TaskApplicationError } from "@/features/tasks/domain/types";
import {
  getTaskById,
  getTaskStatusHistory,
} from "@/features/tasks/server/task-read-queries";
import { resolveTaskPageOrganization } from "@/features/tasks/ui/resolve-task-page-organization";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  collectLabelReferencesFromTaskDetail,
  emptyLabelBundle,
  resolveCustomerLabel,
  resolveLeadLabel,
  resolveLinkedContextLabel,
  resolveMemberLabel,
  resolveProjectLabel,
  resolveProgramLabel,
  resolveTaskDisplayLabels,
  type TaskDisplayLabelBundle,
} from "@/features/tasks/ui/resolve-task-display-labels";
import {
  buildBackToTasksHref,
  parseListReturnState,
} from "@/features/tasks/ui/task-navigation";
import { buildHistoryPresentationItems } from "@/features/tasks/ui/task-history-presentation";
import { formatTaskDueAt } from "@/features/tasks/ui/task-presentation";
import type { TaskListUrlState } from "@/features/tasks/ui/task-list-search-params";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import type { Database } from "@/types/database";

const TASK_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TaskHistoryPresentationItem = {
  id: string;
  transitionLabel: string;
  fromStatusLabel: string | null;
  toStatusLabel: string;
  actorLabel: string;
  sourceLabel: string;
  reason: string | null;
  timestampLabel: string;
};

export type TaskDetailLabels = {
  assignee: string;
  creator?: string;
  linkedContext: string;
  linkedContextKind: string;
  lead?: string;
  customer?: string;
  enrollment?: string;
  program?: string;
  project?: string;
};

export type TaskDetailViewModel = {
  task: import("@/features/tasks/domain/read-types").TaskReadModel;
  labels: TaskDetailLabels;
  history: TaskHistoryPresentationItem[];
  historyState:
    | { kind: "ready" }
    | { kind: "empty" }
    | { kind: "error"; message: string };
  organizationTimezone: string;
  backHref: string;
};

export type TaskDetailPageResult =
  | {
      kind: "ready";
      data: TaskDetailViewModel;
      organizationOptions: OrganizationOption[];
      selectedOrganizationId: string;
      role: OrganizationRole;
      moduleAccess: ProductModuleAccessState;
    }
  | { kind: "auth_required" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "organization_unavailable" }
  | { kind: "task_unavailable"; backHref: string }
  | { kind: "query_error"; message: string };

function isTaskUnavailableError(error: TaskApplicationError): boolean {
  return (
    error.code === "TASK_NOT_FOUND" ||
    error.code === "PERMISSION_DENIED" ||
    error.code === "VALIDATION_ERROR" ||
    error.code === "MALFORMED_INPUT" ||
    error.code === "INSUFFICIENT_ROLE"
  );
}

function isValidTaskId(taskId: string): boolean {
  return TASK_ID_PATTERN.test(taskId);
}

function buildDetailLabels(
  task: TaskDetailViewModel["task"],
  labelBundle: TaskDisplayLabelBundle,
): TaskDetailLabels {
  const linkedContextKind =
    task.linkedContext.kind === "lead"
      ? "Lead"
      : task.linkedContext.kind === "customer"
        ? "Customer"
        : task.linkedContext.kind === "enrollment"
          ? "Enrollment"
          : "Project";

  const labels: TaskDetailLabels = {
    assignee: resolveMemberLabel(task.assigneeMemberId, labelBundle),
    linkedContext: resolveLinkedContextLabel(task.linkedContext, labelBundle),
    linkedContextKind,
  };

  if (task.createdByMemberId) {
    labels.creator = resolveMemberLabel(task.createdByMemberId, labelBundle);
  }

  if (task.linkedContext.kind === "lead") {
    labels.lead = resolveLeadLabel(task.linkedContext.leadId, labelBundle);
  } else if (task.linkedContext.kind === "customer") {
    labels.customer = resolveCustomerLabel(task.linkedContext.customerId, labelBundle);
  } else if (task.linkedContext.kind === "enrollment") {
    labels.enrollment = resolveLinkedContextLabel(task.linkedContext, labelBundle);
    labels.customer = resolveCustomerLabel(task.linkedContext.customerId, labelBundle);
    labels.program = resolveProgramLabel(task.linkedContext.programId, labelBundle);
  } else {
    labels.project = resolveProjectLabel(task.linkedContext.projectId, labelBundle);
  }

  return labels;
}

export async function loadTaskDetailPage(
  supabase: SupabaseClient<Database>,
  taskId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<TaskDetailPageResult> {
  if (!isValidTaskId(taskId)) {
    const provisionalState = parseListReturnState(rawSearchParams, "staff");
    return {
      kind: "task_unavailable",
      backHref: buildBackToTasksHref(provisionalState),
    };
  }

  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveTaskPageOrganization(supabase, orgParam);

  if (orgResult.kind === "auth_required") {
    return { kind: "auth_required" };
  }

  if (orgResult.kind === "organization_unavailable") {
    return { kind: "organization_unavailable" };
  }

  if (orgResult.kind === "organization_required") {
    return { kind: "organization_required", organizations: orgResult.organizations };
  }

  if (orgResult.kind === "org_context_missing") {
    return {
      kind: "query_error",
      message: "Unable to verify organization access. Please try again.",
    };
  }

  if (orgResult.kind === "query_error") {
    return {
      kind: "query_error",
      message: orgResult.message,
    };
  }

  const listReturnState = parseListReturnState(rawSearchParams, orgResult.role);
  const resolvedListState: TaskListUrlState = {
    ...listReturnState,
    org: orgResult.organizationId,
  };
  const resolvedBackHref = buildBackToTasksHref(resolvedListState);

  const taskResult = await getTaskById({
    supabase,
    organizationId: orgResult.organizationId,
    taskId,
  });

  if (!taskResult.ok) {
    if (isTaskUnavailableError(taskResult.error)) {
      return { kind: "task_unavailable", backHref: resolvedBackHref };
    }
    return {
      kind: "query_error",
      message: "Unable to load task details right now. Please try again.",
    };
  }

  const organizationTimezone = orgResult.timeZone;

  const historyResult = await getTaskStatusHistory({
    supabase,
    organizationId: orgResult.organizationId,
    taskId,
  });

  let history: TaskHistoryReadEntry[] = [];
  let historyState: TaskDetailViewModel["historyState"] = { kind: "ready" };

  if (!historyResult.ok) {
    historyState = {
      kind: "error",
      message: "Status history could not be loaded. Reload the page to try again.",
    };
  } else if (historyResult.data.length === 0) {
    historyState = { kind: "empty" };
  } else {
    history = historyResult.data;
  }

  const labelRefs = collectLabelReferencesFromTaskDetail(taskResult.data, history);
  const labelBundle = await resolveTaskDisplayLabels(
    supabase,
    orgResult.organizationId,
    labelRefs,
  ).catch(() => emptyLabelBundle());

  const historyItems = buildHistoryPresentationItems(
    history,
    labelBundle,
    organizationTimezone,
    formatTaskDueAt,
  );

  if (historyState.kind === "ready" && historyItems.length === 0) {
    historyState = { kind: "empty" };
  }

  return {
    kind: "ready",
    selectedOrganizationId: orgResult.organizationId,
    organizationOptions: orgResult.organizationOptions,
    role: orgResult.role,
    moduleAccess: orgResult.moduleAccess,
    data: {
      task: taskResult.data,
      labels: buildDetailLabels(taskResult.data, labelBundle),
      history: historyItems,
      historyState,
      organizationTimezone,
      backHref: resolvedBackHref,
    },
  };
}
