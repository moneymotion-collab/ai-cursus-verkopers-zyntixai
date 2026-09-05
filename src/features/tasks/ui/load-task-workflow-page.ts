import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import { getTaskById } from "@/features/tasks/server/task-read-queries";
import { loadTaskFormOptions, type TaskFormOptions } from "@/features/tasks/ui/load-task-form-options";
import { resolveTaskPageOrganization } from "@/features/tasks/ui/resolve-task-page-organization";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  canShowCreateWorkflow,
  canShowEditWorkflow,
  canShowReassignWorkflow,
  canShowRescheduleWorkflow,
} from "@/features/tasks/ui/task-workflow-visibility";
import { parseListReturnState } from "@/features/tasks/ui/task-navigation";
import { splitDueAtForForm } from "@/features/tasks/ui/task-form-datetime";
import type { TaskListUrlState } from "@/features/tasks/ui/task-list-search-params";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import type { Database } from "@/types/database";

const TASK_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type WorkflowOrgFailure =
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string };

type WorkflowOrgReady = {
  kind: "ready";
  organizationId: string;
  organizationOptions: OrganizationOption[];
  role: OrganizationRole;
  timeZone: string;
  listState: TaskListUrlState;
  moduleAccess: ProductModuleAccessState;
};

async function resolveWorkflowOrganization(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<WorkflowOrgFailure | WorkflowOrgReady> {
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
    moduleAccess: orgResult.moduleAccess,
  };
}

export type TaskCreateInitialContext = {
  contextType: "project";
  contextEntityId: string;
};

export type TaskCreatePageResult =
  | WorkflowOrgFailure
  | { kind: "action_unavailable"; listState: TaskListUrlState }
  | { kind: "form_blocked"; message: string; listState: TaskListUrlState; organizationOptions: OrganizationOption[]; selectedOrganizationId: string }
  | {
      kind: "ready";
      organizationId: string;
      organizationOptions: OrganizationOption[];
      role: OrganizationRole;
      timeZone: string;
      listState: TaskListUrlState;
      options: TaskFormOptions;
      moduleAccess: ProductModuleAccessState;
      initialContext: TaskCreateInitialContext | null;
    };

export async function loadTaskCreatePage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<TaskCreatePageResult> {
  const org = await resolveWorkflowOrganization(supabase, rawSearchParams);
  if (org.kind !== "ready") {
    return org;
  }

  if (!canShowCreateWorkflow(org.role)) {
    return { kind: "action_unavailable", listState: org.listState };
  }

  const options = await loadTaskFormOptions(supabase, org.organizationId);
  const hasContext =
    options.leads.length > 0 ||
    options.customers.length > 0 ||
    options.enrollments.length > 0 ||
    options.projects.length > 0;

  if (!hasContext) {
    return {
      kind: "form_blocked",
      message: "No linked records are available to create a task in this organization.",
      listState: org.listState,
      organizationOptions: org.organizationOptions,
      selectedOrganizationId: org.organizationId,
    };
  }

  const projectIdParam = Array.isArray(rawSearchParams.projectId)
    ? rawSearchParams.projectId[0]
    : rawSearchParams.projectId;
  const initialContext: TaskCreateInitialContext | null =
    projectIdParam && options.projects.some((project) => project.value === projectIdParam)
      ? { contextType: "project", contextEntityId: projectIdParam }
      : null;

  return {
    kind: "ready",
    organizationId: org.organizationId,
    organizationOptions: org.organizationOptions,
    role: org.role,
    timeZone: org.timeZone,
    listState: org.listState,
    options,
    moduleAccess: org.moduleAccess,
    initialContext,
  };
}

type TaskWorkflowPageBase =
  | WorkflowOrgFailure
  | { kind: "invalid_task" }
  | { kind: "task_unavailable"; listState: TaskListUrlState }
  | { kind: "action_unavailable"; listState: TaskListUrlState; task: TaskReadModel }
  | {
      kind: "ready";
      task: TaskReadModel;
      organizationId: string;
      organizationOptions: OrganizationOption[];
      role: OrganizationRole;
      timeZone: string;
      listState: TaskListUrlState;
      options: TaskFormOptions;
      moduleAccess: ProductModuleAccessState;
    };

async function loadMutableTaskWorkflowPage(
  supabase: SupabaseClient<Database>,
  taskId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
  canShow: (task: TaskReadModel, role: OrganizationRole) => boolean,
): Promise<TaskWorkflowPageBase> {
  if (!TASK_ID_PATTERN.test(taskId)) {
    return { kind: "invalid_task" };
  }

  const org = await resolveWorkflowOrganization(supabase, rawSearchParams);
  if (org.kind !== "ready") {
    return org;
  }

  const taskResult = await getTaskById({
    supabase,
    organizationId: org.organizationId,
    taskId,
  });

  if (!taskResult.ok) {
    return { kind: "task_unavailable", listState: org.listState };
  }

  if (!canShow(taskResult.data, org.role)) {
    return { kind: "action_unavailable", listState: org.listState, task: taskResult.data };
  }

  const options = await loadTaskFormOptions(supabase, org.organizationId);

  return {
    kind: "ready",
    task: taskResult.data,
    organizationId: org.organizationId,
    organizationOptions: org.organizationOptions,
    role: org.role,
    timeZone: org.timeZone,
    listState: org.listState,
    options,
    moduleAccess: org.moduleAccess,
  };
}

export type TaskEditPageResult = TaskWorkflowPageBase;
export type TaskReassignPageResult = TaskWorkflowPageBase;
export type TaskReschedulePageResult =
  | Exclude<TaskWorkflowPageBase, { kind: "ready" }>
  | {
      kind: "ready";
      task: TaskReadModel;
      organizationId: string;
      organizationOptions: OrganizationOption[];
      role: OrganizationRole;
      timeZone: string;
      listState: TaskListUrlState;
      options: TaskFormOptions;
      dueDate: string;
      dueTime: string;
      moduleAccess: ProductModuleAccessState;
    };

export function loadTaskEditPage(
  supabase: SupabaseClient<Database>,
  taskId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<TaskEditPageResult> {
  return loadMutableTaskWorkflowPage(
    supabase,
    taskId,
    rawSearchParams,
    canShowEditWorkflow,
  );
}

export function loadTaskReassignPage(
  supabase: SupabaseClient<Database>,
  taskId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<TaskReassignPageResult> {
  return loadMutableTaskWorkflowPage(
    supabase,
    taskId,
    rawSearchParams,
    canShowReassignWorkflow,
  );
}

export async function loadTaskReschedulePage(
  supabase: SupabaseClient<Database>,
  taskId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<TaskReschedulePageResult> {
  const result = await loadMutableTaskWorkflowPage(
    supabase,
    taskId,
    rawSearchParams,
    canShowRescheduleWorkflow,
  );

  if (result.kind !== "ready") {
    return result;
  }

  const split = splitDueAtForForm(result.task.dueAt, result.timeZone);
  if (!split) {
    return { kind: "query_error", message: "Unable to prepare the current due date." };
  }

  return {
    ...result,
    dueDate: split.date,
    dueTime: split.time,
  };
}
