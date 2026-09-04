import { AppShell } from "@/components/app-shell";
import { OrganizationRequiredPanel } from "@/features/tasks/ui/organization-required-panel";
import { loadTaskRestorePage } from "@/features/tasks/ui/load-task-lifecycle-workflow-page";
import { buildBackToTasksHref } from "@/features/tasks/ui/task-navigation";
import { TaskRestoreForm } from "@/features/tasks/ui/task-restore-form";
import { canShowRestoreWorkflow } from "@/features/tasks/ui/task-workflow-visibility";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../../page.module.css";

type TaskRestorePageProps = {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TaskRestorePage({ params, searchParams }: TaskRestorePageProps) {
  const supabase = await createSupabaseServerClient();
  const { taskId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadTaskRestorePage(supabase, taskId, rawSearchParams, canShowRestoreWorkflow);

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
          targetPath={`/tasks/${taskId}/restore`}
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
          <h1>Restore task unavailable</h1>
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
      moduleNavVisibility={result.moduleAccess.navVisibility}
      terminology={result.moduleAccess.terminology}
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction={`/tasks/${taskId}/restore`}
    >
      <section className={styles.page}>
        <TaskRestoreForm
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
