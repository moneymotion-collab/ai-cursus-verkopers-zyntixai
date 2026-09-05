import type { SupabaseClient } from "@supabase/supabase-js";
import { PROJECT_STATUSES, projectPermissions } from "@/features/projects/domain/types";
import type {
  ProjectFormOptions,
  ProjectPageContext,
  ProjectRecord,
  ProjectStatus,
  ProjectTask,
} from "@/features/projects/domain/types";
import {
  getProject,
  listProjects,
  listProjectTasks,
  loadProjectFormOptions,
} from "@/features/projects/server/project-queries";
import {
  resolveProjectPageContext,
  type ProjectContextResult,
} from "@/features/projects/server/resolve-project-page-context";
import type { Database } from "@/types/database";

type SearchParams = Record<string, string | string[] | undefined>;
type LoaderFailure = Exclude<ProjectContextResult, { kind: "ready" }>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function context(
  supabase: SupabaseClient<Database>,
  searchParams: SearchParams,
): Promise<ProjectContextResult> {
  return resolveProjectPageContext(supabase, first(searchParams.org));
}

export type ProjectListPageResult =
  | LoaderFailure
  | {
      kind: "ready";
      context: ProjectPageContext;
      projects: ProjectRecord[];
      filters: { search: string; status?: ProjectStatus; archived: boolean };
    }
  | { kind: "query_error"; message: string; context: ProjectPageContext };

export async function loadProjectsPage(
  supabase: SupabaseClient<Database>,
  searchParams: SearchParams,
): Promise<ProjectListPageResult> {
  const resolved = await context(supabase, searchParams);
  if (resolved.kind !== "ready") return resolved;

  const rawStatus = first(searchParams.status);
  const filters = {
    search: first(searchParams.q)?.trim() ?? "",
    status: PROJECT_STATUSES.includes(rawStatus as ProjectStatus)
      ? (rawStatus as ProjectStatus)
      : undefined,
    archived:
      first(searchParams.archived) === "1" &&
      projectPermissions(resolved.context.role).canViewArchived,
  };
  const result = await listProjects(
    supabase,
    resolved.context.organizationId,
    resolved.context.role,
    filters,
  );
  if (result.error) {
    return { kind: "query_error", message: result.error, context: resolved.context };
  }
  return { kind: "ready", context: resolved.context, projects: result.data, filters };
}

export type ProjectDetailPageResult =
  | LoaderFailure
  | { kind: "unavailable"; context: ProjectPageContext }
  | { kind: "query_error"; message: string; context: ProjectPageContext }
  | {
      kind: "ready";
      context: ProjectPageContext;
      project: ProjectRecord;
      tasks: ProjectTask[];
      tasksWarning: string | null;
    };

export async function loadProjectDetailPage(
  supabase: SupabaseClient<Database>,
  projectId: string,
  searchParams: SearchParams,
): Promise<ProjectDetailPageResult> {
  const resolved = await context(supabase, searchParams);
  if (resolved.kind !== "ready") return resolved;
  if (!UUID.test(projectId)) return { kind: "unavailable", context: resolved.context };

  const project = await getProject(
    supabase,
    resolved.context.organizationId,
    projectId,
    resolved.context.role,
  );
  if (project.error) {
    return { kind: "query_error", message: project.error, context: resolved.context };
  }
  if (!project.data) return { kind: "unavailable", context: resolved.context };

  const tasks = await listProjectTasks(supabase, resolved.context.organizationId, projectId);
  return {
    kind: "ready",
    context: resolved.context,
    project: project.data,
    tasks: tasks.data,
    tasksWarning: tasks.error,
  };
}

export type ProjectFormPageResult =
  | LoaderFailure
  | { kind: "unavailable"; context: ProjectPageContext }
  | { kind: "action_unavailable"; context: ProjectPageContext; message: string }
  | { kind: "query_error"; context: ProjectPageContext; message: string }
  | {
      kind: "ready";
      context: ProjectPageContext;
      options: ProjectFormOptions;
      project?: ProjectRecord;
    };

export async function loadProjectCreatePage(
  supabase: SupabaseClient<Database>,
  searchParams: SearchParams,
): Promise<ProjectFormPageResult> {
  const resolved = await context(supabase, searchParams);
  if (resolved.kind !== "ready") return resolved;
  if (!projectPermissions(resolved.context.role).canCreate) {
    return {
      kind: "action_unavailable",
      context: resolved.context,
      message: "You do not have permission to create projects.",
    };
  }
  const options = await loadProjectFormOptions(supabase, resolved.context.organizationId);
  return { kind: "ready", context: resolved.context, options };
}

export async function loadProjectEditPage(
  supabase: SupabaseClient<Database>,
  projectId: string,
  searchParams: SearchParams,
): Promise<ProjectFormPageResult> {
  const resolved = await context(supabase, searchParams);
  if (resolved.kind !== "ready") return resolved;
  if (!UUID.test(projectId)) return { kind: "unavailable", context: resolved.context };

  const project = await getProject(
    supabase,
    resolved.context.organizationId,
    projectId,
    resolved.context.role,
  );
  if (project.error) {
    return { kind: "query_error", context: resolved.context, message: project.error };
  }
  if (!project.data) return { kind: "unavailable", context: resolved.context };
  if (!projectPermissions(resolved.context.role, Boolean(project.data.archivedAt)).canUpdate) {
    return {
      kind: "action_unavailable",
      context: resolved.context,
      message: project.data.archivedAt
        ? "Archived projects cannot be edited."
        : "You do not have permission to edit this project.",
    };
  }

  const options = await loadProjectFormOptions(supabase, resolved.context.organizationId);
  return { kind: "ready", context: resolved.context, project: project.data, options };
}
