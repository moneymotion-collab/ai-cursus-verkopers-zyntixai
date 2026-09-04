import { AppShell } from "@/components/app-shell";
import { OrganizationRequiredPanel } from "@/features/tasks/ui/organization-required-panel";
import { loadTaskReschedulePage } from "@/features/tasks/ui/load-task-workflow-page";
import { buildBackToTasksHref, buildTaskDetailHref } from "@/features/tasks/ui/task-navigation";
import { TaskRescheduleForm } from "@/features/tasks/ui/task-reschedule-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../../page.module.css";

type TaskReschedulePageProps = {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TaskReschedulePage({ params, searchParams }: TaskReschedulePageProps) {
  const supabase = await createSupabaseServerClient();
  const { taskId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadTaskReschedulePage(supabase, taskId, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell>
        <section className={styles.statePanel}><h1>Sign in required</h1></section>
      </AppShell>
    );
  }

  if (result.kind === "organization_unavailable") {
    return (
      <AppShell>
        <section className={styles.statePanel}><h1>Organization unavailable</h1></section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell organizationOptions={result.organizations}>
        <OrganizationRequiredPanel
          organizations={result.organizations}
          targetPath={`/tasks/${taskId}/reschedule`}
        />
      </AppShell>
    );
  }

  if (result.kind === "invalid_task" || result.kind === "task_unavailable") {
    return (
      <AppShell>
        <section className={styles.statePanel}>
          <h1>Task unavailable</h1>
          <a href={buildBackToTasksHref({ org: undefined, status: "open", archived: false, page: 1, pageSize: 25 })}>
            Back to tasks
          </a>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "action_unavailable") {
    return (
      <AppShell>
        <section className={styles.statePanel}>
          <h1>Reschedule unavailable</h1>
          <p>This task cannot be rescheduled in its current state.</p>
          <a href={buildTaskDetailHref(taskId, result.listState)}>Back to task</a>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "query_error" || result.kind === "org_context_missing") {
    return (
      <AppShell>
        <section className={styles.statePanel}>
          <h1>Unable to load task</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction={`/tasks/${taskId}/reschedule`}
    >
      <section className={styles.page}>
        <TaskRescheduleForm
          organizationId={result.organizationId}
          task={result.task}
          timeZone={result.timeZone}
          dueDate={result.dueDate}
          dueTime={result.dueTime}
          listState={result.listState}
          cancelHref={buildTaskDetailHref(taskId, result.listState)}
        />
      </section>
    </AppShell>
  );
}
