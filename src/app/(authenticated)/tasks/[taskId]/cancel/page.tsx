import { AppShell } from "@/components/app-shell";
import { OrganizationRequiredPanel } from "@/features/tasks/ui/organization-required-panel";
import { loadTaskCancelPage } from "@/features/tasks/ui/load-task-lifecycle-workflow-page";
import { buildBackToTasksHref } from "@/features/tasks/ui/task-navigation";
import { TaskCancelForm } from "@/features/tasks/ui/task-cancel-form";
import { canShowCancelWorkflow } from "@/features/tasks/ui/task-workflow-visibility";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../../page.module.css";

type TaskCancelPageProps = {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TaskCancelPage({ params, searchParams }: TaskCancelPageProps) {
  const supabase = await createSupabaseServerClient();
  const { taskId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadTaskCancelPage(supabase, taskId, rawSearchParams, canShowCancelWorkflow);

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
          targetPath={`/tasks/${taskId}/cancel`}
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
          <h1>Cancel task unavailable</h1>
          <p>{result.message}</p>
          <a href={result.backHref}>Back to task</a>
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
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction={`/tasks/${taskId}/cancel`}
    >
      <section className={styles.page}>
        <TaskCancelForm
          organizationId={result.organizationId}
          task={result.task}
          listState={result.listState}
          timeZone={result.timeZone}
          assigneeLabel={result.assigneeLabel}
          backHref={result.backHref}
        />
      </section>
    </AppShell>
  );
}
