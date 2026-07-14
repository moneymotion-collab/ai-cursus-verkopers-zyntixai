import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import { getTaskById } from "@/features/tasks/server/task-read-queries";
import {
  emptyLabelBundle,
  resolveMemberLabel,
} from "@/features/tasks/ui/resolve-task-display-labels";
import { resolveTaskPageOrganization } from "@/features/tasks/ui/resolve-task-page-organization";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import { buildTaskDetailHref, parseListReturnState } from "@/features/tasks/ui/task-navigation";
import type { TaskListUrlState } from "@/features/tasks/ui/task-list-search-params";
import type { Database } from "@/types/database";

const TASK_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type LifecycleOrgFailure =
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string };

type LifecycleOrgReady = {
  kind: "ready";
  organizationId: string;
  organizationOptions: OrganizationOption[];
  role: OrganizationRole;
  timeZone: string;
  listState: TaskListUrlState;
};

async function resolveLifecycleOrganization(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<LifecycleOrgFailure | LifecycleOrgReady> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveTaskPageOrganization(supabase, orgParam);

  if (orgResult.kind !== "ready") {
    return orgResult;
  }

  const listState: TaskListUrlState = {
    ...parseListReturnState(rawSearchParams, orgResult.role),
    org: orgResult.organizationId,
  };

  return {
    kind: "ready",
    organizationId: orgResult.organizationId,
    organizationOptions: orgResult.organizationOptions,
    role: orgResult.role,
    timeZone: orgResult.timeZone,
    listState,
  };
}

export type TaskLifecycleWorkflowPageResult =
  | LifecycleOrgFailure
  | { kind: "invalid_task" }
  | { kind: "task_unavailable"; listState: TaskListUrlState }
  | { kind: "action_unavailable"; message: string; backHref: string }
  | {
      kind: "ready";
      task: TaskReadModel;
      organizationId: string;
      organizationOptions: OrganizationOption[];
      role: OrganizationRole;
      timeZone: string;
      listState: TaskListUrlState;
      backHref: string;
      assigneeLabel: string | null;
    };

const ACTION_UNAVAILABLE_MESSAGES = {
  complete: "This task cannot be completed in its current state.",
  cancel: "This task cannot be cancelled in its current state.",
  archive: "This task cannot be archived in its current state.",
  restore: "This task cannot be restored in its current state.",
} as const;

type LifecycleAction = keyof typeof ACTION_UNAVAILABLE_MESSAGES;

async function loadTaskLifecycleWorkflowPage(
  supabase: SupabaseClient<Database>,
  taskId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
  action: LifecycleAction,
  canShow: (task: TaskReadModel, role: OrganizationRole) => boolean,
): Promise<TaskLifecycleWorkflowPageResult> {
  if (!TASK_ID_PATTERN.test(taskId)) {
    return { kind: "invalid_task" };
  }

  const org = await resolveLifecycleOrganization(supabase, rawSearchParams);
  if (org.kind !== "ready") {
    return org;
  }

  const taskResult = await getTaskById({
    supabase,
    organizationId: org.organizationId,
    taskId,
  });

  const backHref = buildTaskDetailHref(taskId, org.listState);

  if (!taskResult.ok) {
    return { kind: "task_unavailable", listState: org.listState };
  }

  if (!canShow(taskResult.data, org.role)) {
    return {
      kind: "action_unavailable",
      message: ACTION_UNAVAILABLE_MESSAGES[action],
      backHref,
    };
  }

  const labelBundle = emptyLabelBundle();
  const assigneeLabel = taskResult.data.assigneeMemberId
    ? resolveMemberLabel(taskResult.data.assigneeMemberId, labelBundle)
    : null;

  return {
    kind: "ready",
    task: taskResult.data,
    organizationId: org.organizationId,
    organizationOptions: org.organizationOptions,
    role: org.role,
    timeZone: org.timeZone,
    listState: org.listState,
    backHref,
    assigneeLabel,
  };
}

export function loadTaskCompletePage(
  supabase: SupabaseClient<Database>,
  taskId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
  canShow: (task: TaskReadModel, role: OrganizationRole) => boolean,
): Promise<TaskLifecycleWorkflowPageResult> {
  return loadTaskLifecycleWorkflowPage(supabase, taskId, rawSearchParams, "complete", canShow);
}

export function loadTaskCancelPage(
  supabase: SupabaseClient<Database>,
  taskId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
  canShow: (task: TaskReadModel, role: OrganizationRole) => boolean,
): Promise<TaskLifecycleWorkflowPageResult> {
  return loadTaskLifecycleWorkflowPage(supabase, taskId, rawSearchParams, "cancel", canShow);
}

export function loadTaskArchivePage(
  supabase: SupabaseClient<Database>,
  taskId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
  canShow: (task: TaskReadModel, role: OrganizationRole) => boolean,
): Promise<TaskLifecycleWorkflowPageResult> {
  return loadTaskLifecycleWorkflowPage(supabase, taskId, rawSearchParams, "archive", canShow);
}

export function loadTaskRestorePage(
  supabase: SupabaseClient<Database>,
  taskId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
  canShow: (task: TaskReadModel, role: OrganizationRole) => boolean,
): Promise<TaskLifecycleWorkflowPageResult> {
  return loadTaskLifecycleWorkflowPage(supabase, taskId, rawSearchParams, "restore", canShow);
}
