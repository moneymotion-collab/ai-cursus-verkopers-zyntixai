import { Alert } from "@/components/ui/alert";
import { AppShell } from "@/components/app-shell";
import { Pagination } from "@/components/ui/pagination";
import { OrganizationRequiredPanel } from "@/features/tasks/ui/organization-required-panel";
import { loadTasksPage, tasksPageRetryHref } from "@/features/tasks/ui/load-tasks-page";
import { TaskListFilters } from "@/features/tasks/ui/task-list-filters";
import { TaskListPresentation } from "@/features/tasks/ui/task-list";
import { canShowCreateWorkflow } from "@/features/tasks/ui/task-workflow-visibility";
import { buildTaskCreateHref } from "@/features/tasks/ui/task-navigation";
import {
  buildTaskListQueryString,
  type TaskListUrlState,
} from "@/features/tasks/ui/task-list-search-params";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type TasksPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasActiveFilters(urlState: TaskListUrlState): boolean {
  return Boolean(
    urlState.dueState ||
      urlState.source ||
      urlState.assignee ||
      urlState.q ||
      urlState.archived ||
      urlState.status !== "open",
  );
}

function buildPageHref(urlState: TaskListUrlState, page: number): string {
  return `/tasks${buildTaskListQueryString({ ...urlState, page })}`;
}

function resolveEmptyState(urlState: TaskListUrlState): {
  title: string;
  description: string;
  clearHref?: string;
} {
  if (urlState.archived) {
    return {
      title: "No archived tasks are available.",
      description: "Archived tasks will appear here when they exist for your organization.",
      clearHref: hasActiveFilters(urlState)
        ? `/tasks${buildTaskListQueryString({ org: urlState.org, status: "open", archived: false, page: 1, pageSize: urlState.pageSize })}`
        : undefined,
    };
  }

  if (hasActiveFilters(urlState)) {
    return {
      title: "No tasks match the selected filters.",
      description: "Try adjusting or clearing your filters to see more tasks.",
      clearHref: `/tasks${buildTaskListQueryString({
        org: urlState.org,
        status: "open",
        archived: false,
        page: 1,
        pageSize: urlState.pageSize,
      })}`,
    };
  }

  return {
    title: "No open tasks are available.",
    description: "Open tasks assigned to your organization will appear here.",
  };
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadTasksPage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell>
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to view tasks for your organization.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "no_organizations") {
    return (
      <AppShell>
        <section className={styles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
          <p>No active organization membership is available for this account.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell organizationOptions={result.organizations}>
        <OrganizationRequiredPanel
          organizations={result.organizations}
          targetPath="/tasks"
          description="Select an organization to view tasks."
        />
      </AppShell>
    );
  }

  if (result.kind === "org_context_missing") {
    return (
      <AppShell>
        <section className={styles.statePanel} aria-labelledby="org-context-title">
          <h1 id="org-context-title">Organization unavailable</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "query_error") {
    const retryHref = tasksPageRetryHref({
      org: rawSearchParams.org
        ? Array.isArray(rawSearchParams.org)
          ? rawSearchParams.org[0]
          : rawSearchParams.org
        : undefined,
      status: "open",
      archived: false,
      page: 1,
      pageSize: 25,
    });

    return (
      <AppShell
        organizationOptions={[]}
        selectedOrganizationId={undefined}
      >
        <section className={styles.page}>
          <h1>Tasks</h1>
          <Alert title="Unable to load tasks" variant="error">
            {result.message}
          </Alert>
          <p>
            <a href={retryHref}>Retry loading tasks</a>
          </p>
        </section>
      </AppShell>
    );
  }

  const emptyState = resolveEmptyState(result.urlState);
  const { pagination } = result.list;
  const previousHref =
    pagination.hasPreviousPage ? buildPageHref(result.urlState, pagination.page - 1) : undefined;
  const nextHref =
    pagination.hasNextPage ? buildPageHref(result.urlState, pagination.page + 1) : undefined;

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
    >
      <section className={styles.page}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderRow}>
            <h1>Tasks</h1>
            {canShowCreateWorkflow(result.role) ? (
              <a className={styles.newTaskLink} href={buildTaskCreateHref(result.urlState)}>
                New task
              </a>
            ) : null}
          </div>
          <p className={styles.subtitle}>
            Operational task list for your organization. Times shown in {result.timeZone}.
          </p>
        </header>

        {result.filterWarning ? (
          <Alert title="Filters adjusted" variant="warning">
            {result.filterWarning}
          </Alert>
        ) : null}

        <TaskListFilters
          urlState={result.urlState}
          role={result.role}
          assigneeOptions={result.assigneeOptions}
        />

        <TaskListPresentation
          tasks={result.list.items}
          timeZone={result.timeZone}
          listState={result.urlState}
          labels={result.labels}
          emptyTitle={emptyState.title}
          emptyDescription={emptyState.description}
          clearFiltersHref={emptyState.clearHref}
        />

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          previousHref={previousHref}
          nextHref={nextHref}
        />
      </section>
    </AppShell>
  );
}
