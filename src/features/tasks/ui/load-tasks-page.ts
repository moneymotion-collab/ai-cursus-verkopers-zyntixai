import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskListReadResult } from "@/features/tasks/domain/read-types";
import type { TaskApplicationError } from "@/features/tasks/domain/types";
import { listTasks } from "@/features/tasks/server/task-read-queries";
import { loadTaskMemberFilterOptions } from "@/features/tasks/ui/load-task-form-options";
import {
  buildTaskListQueryString,
  parseTaskListSearchParams,
  type TaskListUrlState,
} from "@/features/tasks/ui/task-list-search-params";
import {
  collectLabelReferencesFromListItems,
  emptyLabelBundle,
  resolveTaskDisplayLabels,
  type TaskDisplayLabelBundle,
} from "@/features/tasks/ui/resolve-task-display-labels";
import { resolveTaskPageOrganization } from "@/features/tasks/ui/resolve-task-page-organization";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import type { TaskMemberOption } from "@/features/tasks/ui/load-task-form-options";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import type { Database } from "@/types/database";

export type TasksPageSuccess = {
  kind: "success";
  organizationOptions: OrganizationOption[];
  selectedOrganizationId: string;
  role: OrganizationOption["role"];
  timeZone: string;
  urlState: TaskListUrlState;
  list: TaskListReadResult;
  labels: TaskDisplayLabelBundle;
  assigneeOptions: TaskMemberOption[];
  filterWarning: string | null;
  moduleAccess: ProductModuleAccessState;
};

export type TasksPageResult =
  | { kind: "auth_required" }
  | { kind: "no_organizations" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string; error?: TaskApplicationError }
  | TasksPageSuccess;

function hasFilterWarnings(warnings: string[]): boolean {
  return warnings.length > 0;
}

export async function loadTasksPage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<TasksPageResult> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveTaskPageOrganization(supabase, orgParam);

  if (orgResult.kind === "auth_required") {
    return { kind: "auth_required" };
  }

  if (orgResult.kind === "organization_unavailable") {
    return { kind: "no_organizations" };
  }

  if (orgResult.kind === "organization_required") {
    return { kind: "organization_required", organizations: orgResult.organizations };
  }

  if (orgResult.kind === "org_context_missing") {
    return { kind: "org_context_missing", message: orgResult.message };
  }

  if (orgResult.kind === "query_error") {
    return { kind: "query_error", message: orgResult.message };
  }

  const assigneeOptions = await loadTaskMemberFilterOptions(
    supabase,
    orgResult.organizationId,
  );

  const parsed = parseTaskListSearchParams(rawSearchParams, {
    role: orgResult.role,
    assigneeOptions: assigneeOptions.map((option) => option.value),
  });

  const urlState: TaskListUrlState = {
    ...parsed.urlState,
    org: orgResult.organizationId,
  };

  const listResult = await listTasks({
    supabase,
    organizationId: orgResult.organizationId,
    filters: parsed.listInput.filters,
    pagination: parsed.listInput.pagination,
    sort: parsed.listInput.sort,
  });

  if (!listResult.ok) {
    return {
      kind: "query_error",
      message: listResult.error.message,
      error: listResult.error,
    };
  }

  const labelRefs = collectLabelReferencesFromListItems(listResult.data.items);
  const labels = await resolveTaskDisplayLabels(
    supabase,
    orgResult.organizationId,
    labelRefs,
  ).catch(() => emptyLabelBundle());

  const filterWarning = hasFilterWarnings(parsed.warnings)
    ? "Some filters were reset because they were invalid."
    : null;

  return {
    kind: "success",
    organizationOptions: orgResult.organizationOptions,
    selectedOrganizationId: orgResult.organizationId,
    role: orgResult.role,
    timeZone: orgResult.timeZone,
    urlState,
    list: listResult.data,
    labels,
    assigneeOptions,
    filterWarning,
    moduleAccess: orgResult.moduleAccess,
  };
}

export function tasksPageRetryHref(urlState: TaskListUrlState): string {
  return `/tasks${buildTaskListQueryString(urlState)}`;
}
