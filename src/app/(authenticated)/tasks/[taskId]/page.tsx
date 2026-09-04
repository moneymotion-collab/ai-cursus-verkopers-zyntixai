import { AppShell } from "@/components/app-shell";
import { Alert } from "@/components/ui/alert";
import { OrganizationRequiredPanel } from "@/features/tasks/ui/organization-required-panel";
import { loadTaskDetailPage } from "@/features/tasks/ui/load-task-detail";
import { TaskDetail, TaskUnavailableDetail } from "@/features/tasks/ui/task-detail";
import {
  buildTaskArchiveHref,
  buildTaskCancelHref,
  buildTaskCompleteHref,
  buildTaskEditHref,
  buildTaskReassignHref,
  buildTaskRescheduleHref,
  buildTaskRestoreHref,
  parseListReturnState,
} from "@/features/tasks/ui/task-navigation";
import { buildTaskListQueryString } from "@/features/tasks/ui/task-list-search-params";
import {
  canShowArchiveWorkflow,
  canShowCancelWorkflow,
  canShowCompleteWorkflow,
  canShowEditWorkflow,
  canShowReassignWorkflow,
  canShowRescheduleWorkflow,
  canShowRestoreWorkflow,
} from "@/features/tasks/ui/task-workflow-visibility";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type TaskDetailPageProps = {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TaskDetailPage({ params, searchParams }: TaskDetailPageProps) {
  const supabase = await createSupabaseServerClient();
  const { taskId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadTaskDetailPage(supabase, taskId, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell>
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to view task details for your organization.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_unavailable") {
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
          targetPath={`/tasks/${taskId}`}
          description="Select an organization to view this task."
        />
      </AppShell>
    );
  }

  if (result.kind === "query_error") {
    return (
      <AppShell>
        <section className={styles.page}>
          <h1>Task details</h1>
          <Alert title="Unable to load task" variant="error">
            {result.message}
          </Alert>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "task_unavailable") {
    return (
      <AppShell>
        <TaskUnavailableDetail backHref={result.backHref} />
      </AppShell>
    );
  }

  const listState = {
    ...parseListReturnState(rawSearchParams, result.role),
    org: result.selectedOrganizationId,
  };
  const reloadHref = `/tasks/${taskId}${buildTaskListQueryString(listState)}`;
  const workflowLinks = {
    edit: canShowEditWorkflow(result.data.task, result.role)
      ? buildTaskEditHref(taskId, listState)
      : undefined,
    reassign: canShowReassignWorkflow(result.data.task, result.role)
      ? buildTaskReassignHref(taskId, listState)
      : undefined,
    reschedule: canShowRescheduleWorkflow(result.data.task, result.role)
      ? buildTaskRescheduleHref(taskId, listState)
      : undefined,
    complete: canShowCompleteWorkflow(result.data.task, result.role)
      ? buildTaskCompleteHref(taskId, listState)
      : undefined,
    cancel: canShowCancelWorkflow(result.data.task, result.role)
      ? buildTaskCancelHref(taskId, listState)
      : undefined,
    archive: canShowArchiveWorkflow(result.data.task, result.role)
      ? buildTaskArchiveHref(taskId, listState)
      : undefined,
    restore: canShowRestoreWorkflow(result.data.task, result.role)
      ? buildTaskRestoreHref(taskId, listState)
      : undefined,
  };

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      terminology={result.moduleAccess.terminology}
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction={`/tasks/${taskId}`}
    >
      <section className={styles.page}>
        <TaskDetail
          viewModel={result.data}
          reloadHref={reloadHref}
          workflowLinks={workflowLinks}
        />
      </section>
    </AppShell>
  );
}
