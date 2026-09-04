import { AppShell } from "@/components/app-shell";
import { OrganizationRequiredPanel } from "@/features/tasks/ui/organization-required-panel";
import { loadTaskCreatePage } from "@/features/tasks/ui/load-task-workflow-page";
import { buildBackToTasksHref } from "@/features/tasks/ui/task-navigation";
import { TaskCreateForm } from "@/features/tasks/ui/task-create-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../page.module.css";

type TaskCreatePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TaskCreatePage({ searchParams }: TaskCreatePageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadTaskCreatePage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell>
        <section className={styles.statePanel}>
          <h1>Sign in required</h1>
          <p>Please sign in to create tasks.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_unavailable") {
    return (
      <AppShell>
        <section className={styles.statePanel}>
          <h1>Organization unavailable</h1>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell organizationOptions={result.organizations}>
        <OrganizationRequiredPanel
          organizations={result.organizations}
          targetPath="/tasks/new"
          description="Select an organization before creating a task."
        />
      </AppShell>
    );
  }

  if (result.kind === "query_error" || result.kind === "org_context_missing") {
    return (
      <AppShell>
        <section className={styles.statePanel}>
          <h1>Unable to load create task form</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "action_unavailable") {
    return (
      <AppShell>
        <section className={styles.statePanel}>
          <h1>Create task unavailable</h1>
          <p>You do not have permission to create tasks.</p>
          <a href={buildBackToTasksHref(result.listState)}>Back to tasks</a>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "form_blocked") {
    return (
      <AppShell
        organizationOptions={result.organizationOptions}
        selectedOrganizationId={result.selectedOrganizationId}
        organizationSelectorAction="/tasks/new"
      >
        <section className={styles.statePanel}>
          <h1>Create task unavailable</h1>
          <p>{result.message}</p>
          <a href={buildBackToTasksHref(result.listState)}>Back to tasks</a>
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
      organizationSelectorAction="/tasks/new"
    >
      <section className={styles.page}>
        <TaskCreateForm
          organizationId={result.organizationId}
          timeZone={result.timeZone}
          listState={result.listState}
          options={result.options}
          cancelHref={buildBackToTasksHref(result.listState)}
        />
      </section>
    </AppShell>
  );
}
